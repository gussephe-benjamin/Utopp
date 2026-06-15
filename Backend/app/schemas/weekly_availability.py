WEEKLY_AVAILABILITY_KEY = "disponibilidad a la semana"
ALLOWED_WEEK_DAYS = frozenset({"lunes", "martes", "miercoles", "jueves", "viernes", "sabado"})
ALLOWED_TIME_SLOTS = frozenset({"mañana", "tarde", "noche"})


def validate_weekly_availability(value: dict) -> dict:
    if WEEKLY_AVAILABILITY_KEY not in value:
        raise ValueError(f"Falta la clave '{WEEKLY_AVAILABILITY_KEY}'")

    schedule = value[WEEKLY_AVAILABILITY_KEY]
    if not isinstance(schedule, dict):
        raise ValueError(f"'{WEEKLY_AVAILABILITY_KEY}' debe ser un objeto")

    unknown_days = set(schedule.keys()) - ALLOWED_WEEK_DAYS
    if unknown_days:
        raise ValueError(f"Días no permitidos: {', '.join(sorted(unknown_days))}")

    normalized_schedule: dict[str, list[str]] = {}
    for day in ALLOWED_WEEK_DAYS:
        slots = schedule.get(day, [])
        if slots is None:
            slots = []
        if not isinstance(slots, list):
            raise ValueError(f"Los horarios de '{day}' deben ser una lista")

        normalized_slots: list[str] = []
        seen: set[str] = set()
        for slot in slots:
            if not isinstance(slot, str):
                raise ValueError(f"Horario inválido en '{day}'")
            if slot not in ALLOWED_TIME_SLOTS:
                raise ValueError(f"Horario no permitido en '{day}': {slot}")
            if slot in seen:
                continue
            seen.add(slot)
            normalized_slots.append(slot)

        normalized_schedule[day] = normalized_slots

    return {WEEKLY_AVAILABILITY_KEY: normalized_schedule}
