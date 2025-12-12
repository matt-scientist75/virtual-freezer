
from pydantic import BaseModel
from typing import Optional, List

class CellBase(BaseModel):
    row: int
    col: int
    status: str
    vial_name: Optional[str] = None
    owner: Optional[str] = None
    project: Optional[str] = None

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

class ContainerUpdate(BaseModel):
    name: Optional[str] = None

class CellUpdate(BaseModel):
    owner: Optional[str] = None
    project: Optional[str] = None
    status: Optional[str] = None
    vial_name: Optional[str] = None
