
from pydantic import BaseModel
from typing import Optional, List

class CellBase(BaseModel):
    row: int
    col: int
    status: str
    sample_id: Optional[str] = None

class Cell(CellBase):
    id: int
    class Config:
        from_attributes = True

class ContainerBase(BaseModel):
    name: str
    type: str
    rows: int
    cols: int

class Container(ContainerBase):
    id: int
    cells: List[Cell]
    class Config:
        from_attributes = True

class ContainerCreate(ContainerBase):
    pass

class CellUpdate(BaseModel):
    status: Optional[str] = None
    sample_id: Optional[str] = None
