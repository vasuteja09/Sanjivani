from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseScanner(ABC):
    @abstractmethod
    async def is_available(self) -> bool:
        """Checks if the static analysis binary or library is accessible."""
        pass

    @abstractmethod
    async def scan_code(self, code: str, file_name: str, language: str) -> List[Dict[str, Any]]:
        """Scans code string safely using isolated temporary files."""
        pass
