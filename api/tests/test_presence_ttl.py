"""Regression: astrologer presence must survive browser timer throttling.

Chrome checks timers only once per minute in a tab hidden for 5+ minutes, so the
client's 25s heartbeat PING can arrive ~60s+ apart. A 60s presence TTL lapsed in
between and flipped the astrologer OFFLINE for seekers whenever they switched to
another window. The TTL must leave room for at least two throttled ticks.
"""
from unittest.mock import patch

from app.routers import realtime
from app.services.settings_service import DEFAULTS

THROTTLED_TIMER_INTERVAL_SECONDS = 60


def test_default_presence_ttl_outlasts_throttled_heartbeat():
    assert int(DEFAULTS["presence_ttl_seconds"]) > 2 * THROTTLED_TIMER_INTERVAL_SECONDS


def test_presence_ttl_reads_admin_override():
    with patch.object(realtime, "get_setting", return_value="240"):
        assert realtime._presence_ttl() == 240


def test_presence_ttl_falls_back_when_setting_invalid():
    with patch.object(realtime, "get_setting", return_value="not-a-number"):
        assert realtime._presence_ttl() > 2 * THROTTLED_TIMER_INTERVAL_SECONDS
