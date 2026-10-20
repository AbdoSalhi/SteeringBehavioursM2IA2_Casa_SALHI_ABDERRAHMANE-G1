class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    for (const cell of this.cells.values()) cell.length = 0;
  }

  insert(entity) {
    const key = this.key(Math.floor(entity.pos.x / this.cellSize), Math.floor(entity.pos.y / this.cellSize));
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
  }

  queryInto(position, radius, result) {
    result.length = 0;
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const cell = this.cells.get(this.key(x, y));
        if (cell) {
          for (const entity of cell) result.push(entity);
        }
      }
    }
    return result;
  }

  key(x, y) {
    return (x + 32768) * 65536 + y + 32768;
  }
}
