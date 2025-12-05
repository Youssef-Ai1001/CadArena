"""
Chat history API endpoints for storing and retrieving chat messages.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import User, Project, ChatMessage
from app.api.v1.auth import get_current_verified_user
from app.api.v1.schemas import ChatMessageCreate, ChatMessageResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Create a new chat message and save it to the database.
    """
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == message_data.project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Validate message type
    if message_data.message_type not in ['user', 'ai', 'system']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid message type. Must be 'user', 'ai', or 'system'"
        )
    
    # Create chat message
    new_message = ChatMessage(
        project_id=message_data.project_id,
        message_type=message_data.message_type,
        content=message_data.content,
        dxf_data=message_data.dxf_data
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message


@router.get("/messages/{project_id}", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    project_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Get all chat messages for a specific project.
    Messages are returned in chronological order.
    """
    # Verify project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all messages for the project
    messages = db.query(ChatMessage).filter(
        ChatMessage.project_id == project_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    return messages


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_message(
    message_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific chat message.
    """
    # Get message and verify it belongs to user's project
    message = db.query(ChatMessage).join(Project).filter(
        ChatMessage.id == message_id,
        Project.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    db.delete(message)
    db.commit()
    
    return None

