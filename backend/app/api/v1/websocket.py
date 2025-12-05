from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Project, Conversation, ChatMessage
from app.services.ai_service import ai_service
from app.core.security import decode_access_token
import json
import asyncio

router = APIRouter()


def get_user_from_token(token: str, db: Session) -> User:
    """Get user from JWT token."""
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


@router.websocket("/ws/chat/{project_id}")
async def websocket_chat(websocket: WebSocket, project_id: int):
    """WebSocket endpoint for real-time chat and DXF generation."""
    await websocket.accept()
    
    # Get authentication token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    # Validate user and project
    db: Session = next(get_db())
    project = None
    try:
        user = get_user_from_token(token, db)
        
        # Verify project exists and belongs to user
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.user_id == user.id
        ).first()
        
        if not project:
            await websocket.close(code=1008, reason="Project not found")
            return
    except HTTPException:
        await websocket.close(code=1008, reason="Authentication failed")
        return
    except Exception as e:
        await websocket.close(code=1008, reason=f"Authentication failed: {str(e)}")
        return
    finally:
        db.close()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") != "prompt" or "prompt" not in message:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid message format. Expected {'type': 'prompt', 'prompt': '...'}"
                })
                continue
            
            prompt_text = message["prompt"]
            
            # Save user message to database
            db = next(get_db())
            try:
                user_message = ChatMessage(
                    project_id=project_id,
                    message_type="user",
                    content=prompt_text
                )
                db.add(user_message)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Error saving user message: {e}")
            finally:
                db.close()
            
            # Send acknowledgment
            await websocket.send_json({
                "type": "status",
                "message": "Processing your request..."
            })
            
            # Generate DXF using AI service (non-blocking)
            try:
                dxf_output = await ai_service.generate_dxf_from_prompt(prompt_text)
                
                # Save AI response and DXF to database
                db = next(get_db())
                try:
                    # Save AI message
                    ai_message = ChatMessage(
                        project_id=project_id,
                        message_type="ai",
                        content="DXF generated successfully!",
                        dxf_data=dxf_output
                    )
                    db.add(ai_message)
                    
                    # Also save to Conversation table for backward compatibility
                    conversation = Conversation(
                        project_id=project_id,
                        prompt_text=prompt_text,
                        dxf_output_data=dxf_output
                    )
                    db.add(conversation)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Error saving conversation: {e}")
                finally:
                    db.close()
                
                # Send DXF output to client
                await websocket.send_json({
                    "type": "dxf_output",
                    "data": dxf_output
                })
                
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Error generating DXF: {str(e)}"
                })
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for project {project_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass

