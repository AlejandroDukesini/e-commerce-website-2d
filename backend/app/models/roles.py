"""Canonical RBAC role definitions.

Kept as a str-Enum so roles are type-safe in Python, serialize cleanly to
JSON, and can be stored as plain text in SQLite.
"""
from enum import Enum


class Role(str, Enum):
    CLIENTE = "cliente"
    EMPLEADO = "empleado"
    GERENTE = "gerente"
    DESARROLLADOR = "desarrollador"

    @classmethod
    def values(cls) -> list[str]:
        return [r.value for r in cls]


# Simple privilege ordering (higher number == more access). Used by guards
# that want "at least this level" semantics instead of exact-role checks.
ROLE_LEVEL: dict[str, int] = {
    Role.CLIENTE.value: 1,
    Role.EMPLEADO.value: 2,
    Role.GERENTE.value: 3,
    Role.DESARROLLADOR.value: 4,
}
