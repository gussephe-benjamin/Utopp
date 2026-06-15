import sys
from pathlib import Path

import pytest

BACKEND_APP_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_APP_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_PATH))

from app.schemas.onboarding import UserOnboardingData
from app.schemas.user import UserUpdate
from app.schemas.weekly_availability import validate_weekly_availability


SAMPLE_WEEKLY_AVAILABILITY = {
    "disponibilidad a la semana": {
        "lunes": ["mañana", "tarde"],
        "martes": ["tarde"],
        "miercoles": [],
        "jueves": ["noche"],
        "viernes": ["mañana"],
        "sabado": [],
    }
}


class TestWeeklyAvailabilitySchema:
    def test_validate_weekly_availability_normalizes_missing_days(self):
        payload = {
            "disponibilidad a la semana": {
                "lunes": ["mañana"],
                "martes": ["tarde", "tarde"],
            }
        }
        normalized = validate_weekly_availability(payload)
        schedule = normalized["disponibilidad a la semana"]

        assert schedule["lunes"] == ["mañana"]
        assert schedule["martes"] == ["tarde"]
        assert schedule["miercoles"] == []
        assert schedule["sabado"] == []

    def test_user_update_accepts_weekly_availability(self):
        data = UserUpdate(
            weekly_availability=SAMPLE_WEEKLY_AVAILABILITY,
        )
        assert data.weekly_availability["disponibilidad a la semana"]["lunes"] == ["mañana", "tarde"]

    def test_user_onboarding_data_only_career_and_cycle(self):
        data = UserOnboardingData(career="Computer Science", cycle=5)
        assert data.career == "Computer Science"
        assert data.cycle == 5

    def test_validate_rejects_unknown_day(self):
        payload = {
            "disponibilidad a la semana": {
                "domingo": ["mañana"],
            }
        }
        with pytest.raises(ValueError):
            validate_weekly_availability(payload)

    def test_validate_rejects_unknown_slot(self):
        payload = {
            "disponibilidad a la semana": {
                "lunes": ["madrugada"],
            }
        }
        with pytest.raises(ValueError):
            validate_weekly_availability(payload)
