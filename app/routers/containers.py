
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/containers", tags=["containers"])

@router.get("/", response_model=List[schemas.Container])
def list_containers(db: Session = Depends(get_db)):
    return db.query(models.Container).all()

@router.post("/", response_model=schemas.Container)
def create_container(payload: schemas.ContainerCreate, db: Session = Depends(get_db)):
    c = models.Container(name=payload.name, type=payload.type, rows=payload.rows, cols=payload.cols)
    db.add(c)
    db.flush()
    for r in range(1, payload.rows+1):
        for col in range(1, payload.cols+1):
            db.add(models.Cell(container_id=c.id, row=r, col=col, status='EMPTY'))
    db.commit()
    db.refresh(c)
    return c

@router.get("/{container_id}", response_model=schemas.Container)
def get_container(container_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Container).filter(models.Container.id==container_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Container not found")
    return c

@router.get("/{container_id}/cells", response_model=List[schemas.Cell])
def list_cells(container_id: int, db: Session = Depends(get_db)):
    return db.query(models.Cell).filter(models.Cell.container_id==container_id).order_by(models.Cell.row, models.Cell.col).all()

@router.put("/{container_id}/cells/{cell_id}", response_model=schemas.Cell)
def update_cell(container_id: int, cell_id: int, payload: schemas.CellUpdate, db: Session = Depends(get_db)):
    cell = db.query(models.Cell).filter(models.Cell.id==cell_id, models.Cell.container_id==container_id).first()
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    if payload.status is not None:
        if payload.status not in {"EMPTY","OCCUPIED","RESERVED"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        cell.status = payload.status
    if payload.sample_id is not None:
        if payload.sample_id and not payload.sample_id.isdigit():
            raise HTTPException(status_code=400, detail="sample_id must be numeric")
        cell.sample_id = payload.sample_id
    db.commit()
    db.refresh(cell)
    return cell
