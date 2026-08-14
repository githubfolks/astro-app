"""
Renders a completed ad-hoc report's JSON payload (see report_generator_service.py)
into a downloadable PDF using reportlab — same library already used for the
admin CSV/table exports in routers/admin.py, but laid out as a narrative
document instead of a table.
"""
import calendar
import io
import os
import re
from datetime import date as _date
from typing import Any, Dict, Optional, Tuple
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, Image, PageBreak
from reportlab.graphics.shapes import Drawing, Rect, Line, Polygon, String, Circle

_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
_GANPATI_IMAGE_PATH = os.path.join(_STATIC_DIR, "ganpati.png")

_AMBER = colors.HexColor("#b45309")
_AMBER_DARK = colors.HexColor("#78350f")
_RULE = colors.HexColor("#f59e0b")

# Mirrors web/src/components/KundliChart.tsx — same North Indian diamond
# layout and abbreviations, so the PDF matches what's shown in the
# astrologer-chat Kundli panel.
_RASHI_ABBR = {
    "Aries": "Ari", "Taurus": "Tau", "Gemini": "Gem", "Cancer": "Can",
    "Leo": "Leo", "Virgo": "Vir", "Libra": "Lib", "Scorpio": "Sco",
    "Sagittarius": "Sag", "Capricorn": "Cap", "Aquarius": "Aqu", "Pisces": "Pis",
}
_PLANET_SHORT = {
    "sun": "Su", "moon": "Mo", "mars": "Ma", "mercury": "Me", "jupiter": "Ju",
    "venus": "Ve", "saturn": "Sa", "rahu": "Ra", "ketu": "Ke",
}


def _house_polygons(size: float):
    A, B, C, D = (0, 0), (size, 0), (size, size), (0, size)
    P, Q, R, Sm = (size / 2, 0), (size, size / 2), (size / 2, size), (0, size / 2)
    O = (size / 2, size / 2)
    X1, X2 = (size * 0.75, size * 0.75), (size * 0.25, size * 0.25)
    X3, X4 = (size * 0.75, size * 0.25), (size * 0.25, size * 0.75)
    return {
        1: [P, X3, O, X2], 2: [A, P, X2], 3: [A, Sm, X2], 4: [Sm, X2, O, X4],
        5: [D, Sm, X4], 6: [D, R, X4], 7: [R, X4, O, X1], 8: [C, R, X1],
        9: [C, Q, X1], 10: [Q, X1, O, X3], 11: [B, Q, X3], 12: [B, P, X3],
    }


def _centroid(points):
    n = len(points)
    return (sum(p[0] for p in points) / n, sum(p[1] for p in points) / n)


def _north_indian_chart_drawing(division_chart: Dict[str, Any], title: str, size: float = 260) -> Drawing:
    """Draws a North Indian diamond birth chart — same geometry/labels as the
    web KundliChart component, rendered with reportlab shapes for the PDF."""
    houses = division_chart.get("houses") or []
    planets = division_chart.get("planets") or []
    sign_by_house = {h.get("house"): h for h in houses if h.get("house") is not None}
    planets_by_house: Dict[int, list] = {}
    for p in planets:
        planets_by_house.setdefault(p.get("house"), []).append(p)

    d = Drawing(size, size)
    d.add(Rect(0, 0, size, size, strokeColor=colors.HexColor("#8B4513"), strokeWidth=1.2, fillColor=None))
    d.add(Line(0, size, size, 0, strokeColor=colors.HexColor("#B8860B"), strokeWidth=0.8))
    d.add(Line(0, 0, size, size, strokeColor=colors.HexColor("#B8860B"), strokeWidth=0.8))
    d.add(Polygon(
        [size / 2, size, size, size / 2, size / 2, 0, 0, size / 2],
        strokeColor=colors.HexColor("#B8860B"), strokeWidth=0.8, fillColor=None,
    ))
    d.add(String(size / 2, size / 2 + 4, title, textAnchor="middle", fontSize=8, fontName="Helvetica-Bold", fillColor=colors.HexColor("#3D2400")))

    for house, points in _house_polygons(size).items():
        # SVG y-axis points down; reportlab's points up — flip here so the
        # layout matches the web chart when read top-to-bottom.
        flipped = [(x, size - y) for x, y in points]
        cx, cy = _centroid(flipped)
        sign = sign_by_house.get(house)
        house_planets = planets_by_house.get(house, [])

        label = f"{_RASHI_ABBR.get(sign.get('sign'), (sign.get('sign') or '')[:3])}({sign.get('sign_id')}) H{house}" if sign else f"H{house}"
        d.add(String(cx, cy + (10 if house_planets else 0), label, textAnchor="middle", fontSize=6, fontName="Helvetica-Bold", fillColor=colors.HexColor("#5C3D00")))

        for idx, planet in enumerate(house_planets):
            short = _PLANET_SHORT.get((planet.get("name") or "").lower(), (planet.get("name") or "")[:2])
            retro = "*" if planet.get("is_retrograde") else ""
            py = cy - 4 - (idx * 9)
            d.add(String(cx, py, f"{short}{retro}", textAnchor="middle", fontSize=7, fontName="Helvetica-Bold", fillColor=colors.HexColor("#111111")))

    return d


def _planets_table(planets: list) -> Table:
    header = ["Planet", "Sign", "House", "Degree", "Nakshatra", "Retro"]
    rows = [header]
    for p in planets:
        deg = p.get("degree_in_sign")
        rows.append([
            str(p.get("name", "-")),
            str(p.get("sign", "-")),
            str(p.get("house", "-")),
            f"{deg:.2f}°" if isinstance(deg, (int, float)) else "-",
            str(p.get("nakshatra", "-")),
            "Yes" if p.get("is_retrograde") else "-",
        ])
    t = Table(rows, colWidths=[24 * mm, 24 * mm, 16 * mm, 20 * mm, 32 * mm, 16 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), _AMBER_DARK),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eee")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def _dasha_table(vimshottari: Dict[str, Any]) -> Table:
    header = ["Level", "Lord", "Start", "End"]
    rows = [header]
    for period in (vimshottari.get("active_periods") or []):
        rows.append([
            str(period.get("level", "-")),
            str(period.get("lord", "-")),
            str(period.get("start", "-"))[:10],
            str(period.get("end", "-"))[:10],
        ])
    t = Table(rows, colWidths=[28 * mm, 24 * mm, 30 * mm, 30 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), _AMBER_DARK),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eee")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def _calendar_diff(start_str: str, end_str: str) -> Optional[Tuple[int, int, int]]:
    """Calendar-correct (Y, M, D) difference between two ISO date strings —
    matches how traditional Vedic software computes a dasa balance, rather
    than converting a fractional-year float (which drifts by rounding)."""
    try:
        start = _date.fromisoformat(start_str[:10])
        end = _date.fromisoformat(end_str[:10])
    except (ValueError, TypeError):
        return None
    years = end.year - start.year
    months = end.month - start.month
    days = end.day - start.day
    if days < 0:
        months -= 1
        prev_month = end.month - 1 or 12
        prev_month_year = end.year if end.month > 1 else end.year - 1
        days += calendar.monthrange(prev_month_year, prev_month)[1]
    if months < 0:
        years -= 1
        months += 12
    return years, months, days


def _mahadasha_timeline_table(timeline: list) -> Table:
    """Full life Vimshottari Mahadasha sequence (birth to ~120 years) — the
    `timeline` field FreeAstroAPI already returns alongside `active_periods`,
    equivalent to AstroSage's "Vimshottari Mahadasha Phal" table."""
    header = ["Lord", "Start", "End", "Duration"]
    rows = [header]
    for period in timeline:
        rows.append([
            str(period.get("lord", "-")),
            str(period.get("start", "-"))[:10],
            str(period.get("end", "-"))[:10],
            f"{period.get('duration_years', '-')} yrs" if period.get("duration_years") is not None else "-",
        ])
    t = Table(rows, colWidths=[24 * mm, 30 * mm, 30 * mm, 22 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), _AMBER_DARK),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eee")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


_MANGLIK_REMEDIES = [
    "Worship Lord Hanuman by reciting the Hanuman Chalisa daily.",
    "Recite the Mahamrityunjaya mantra as a remedial practice.",
    "Fast on Tuesdays, the day associated with Mars.",
    "Consult a qualified astrologer before undertaking any specific remedy or muhurta-based ritual.",
]
_KALASARPA_REMEDIES = [
    "Worship Lord Shiva and recite the Maha Mrityunjaya mantra.",
    "Perform Rahu-Ketu shanti puja, ideally at a recognised temple such as Trimbakeshwar or Kalahasti.",
    "Consult a qualified astrologer before undertaking any specific remedy or puja.",
]


def _remedies_paragraph(title: str, remedies: list, style: ParagraphStyle) -> Paragraph:
    items = "".join(f"&bull; {escape(r)}<br/>" for r in remedies)
    return Paragraph(f"<b>{escape(title)} — Suggested Remedies:</b><br/>{items}", style)


_RED_BG = colors.HexColor("#fef2f2")
_RED_BORDER = colors.HexColor("#fca5a5")
_RED_TEXT = colors.HexColor("#b91c1c")
_GREEN_BG = colors.HexColor("#ecfdf5")
_GREEN_BORDER = colors.HexColor("#6ee7b7")
_GREEN_TEXT = colors.HexColor("#047857")
_PURPLE_BG = colors.HexColor("#f5f3ff")
_PURPLE_BORDER = colors.HexColor("#c4b5fd")
_PURPLE_TEXT = colors.HexColor("#6d28d9")


def _flame_icon(size: float, color: colors.Color) -> Drawing:
    """Manglik Dosha (Mars) — a simple flame silhouette, echoing the web
    report's Flame icon."""
    d = Drawing(size, size)
    d.add(Polygon(
        [
            size * 0.5, size * 0.95,
            size * 0.75, size * 0.6,
            size * 0.65, size * 0.62,
            size * 0.7, size * 0.3,
            size * 0.5, size * 0.05,
            size * 0.3, size * 0.3,
            size * 0.35, size * 0.62,
            size * 0.25, size * 0.6,
        ],
        fillColor=color, strokeColor=None,
    ))
    return d


def _infinity_icon(size: float, color: colors.Color) -> Drawing:
    """Kala Sarpa Yoga — two interlocking rings echoing the web report's
    Infinity icon (all classical planets bound within one nodal arc)."""
    d = Drawing(size, size)
    r = size * 0.24
    for cx in (size * 0.32, size * 0.68):
        d.add(Circle(cx, size * 0.5, r, fillColor=None, strokeColor=color, strokeWidth=size * 0.11))
    return d


def _orbit_icon(size: float, color: colors.Color) -> Drawing:
    """Shani Sade Sati — an orbital ring with a transiting planet dot,
    echoing the web report's Orbit icon."""
    d = Drawing(size, size)
    d.add(Circle(size * 0.5, size * 0.5, size * 0.4, fillColor=None, strokeColor=color, strokeWidth=size * 0.09))
    d.add(Circle(size * 0.5, size * 0.5, size * 0.14, fillColor=color, strokeColor=None))
    d.add(Circle(size * 0.85, size * 0.62, size * 0.09, fillColor=color, strokeColor=None))
    return d


_STATUS_ICONS = {
    "manglik": _flame_icon,
    "kalasarpa": _infinity_icon,
    "sadesati": _orbit_icon,
}


def _status_table(title: str, present: bool, description: str, icon: Optional[str] = None) -> Table:
    """A colored status card (red=present/dosha, green=clear) with an
    optional themed icon — mirrors the DoshaCard component in the web
    report viewer (Flame / Infinity / Orbit for Manglik / Kala Sarpa /
    Sade Sati respectively)."""
    bg, border, text_color, label = (
        (_RED_BG, _RED_BORDER, _RED_TEXT, "PRESENT") if present
        else (_GREEN_BG, _GREEN_BORDER, _GREEN_TEXT, "CLEAR")
    )
    cell = Paragraph(
        f"<b>{escape(title)}</b> &mdash; <font color='{text_color.hexval()}'><b>{label}</b></font><br/>"
        f"<font size=8 color='#555'>{escape(description or '')}</font>",
        ParagraphStyle("StatusCell", fontSize=9, leading=12),
    )
    icon_fn = _STATUS_ICONS.get(icon) if icon else None
    if icon_fn:
        icon_drawing = icon_fn(9 * mm, text_color)
        row = [icon_drawing, cell]
        col_widths = [12 * mm, 158 * mm]
    else:
        row = [cell]
        col_widths = [170 * mm]

    t = Table([row], colWidths=col_widths)
    style = [
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.75, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    if icon_fn:
        style.append(("ALIGN", (0, 0), (0, 0), "CENTER"))
    t.setStyle(TableStyle(style))
    return t


def _ashtakavarga_table(sarva: list, total_points: Any) -> Table:
    signs = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"]
    rows = [signs, [str(p) for p in sarva]]
    t = Table(rows, colWidths=[14.1 * mm] * 12)
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), _AMBER_DARK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eee")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def _styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("AadiTitle", parent=styles["Title"], textColor=_AMBER_DARK, fontSize=18, leading=22),
        "eyebrow": ParagraphStyle("AadiEyebrow", parent=styles["Normal"], textColor=_AMBER, fontSize=9),
        "heading": ParagraphStyle("AadiHeading", parent=styles["Heading2"], textColor=_AMBER_DARK, fontSize=13, spaceBefore=10, spaceAfter=4),
        "body": ParagraphStyle("AadiBody", parent=styles["Normal"], fontSize=10, leading=15),
        "small": ParagraphStyle("AadiSmall", parent=styles["Normal"], fontSize=8, textColor=colors.grey),
    }


def _rule(elements):
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(width="100%", color=_RULE, thickness=0.75))
    elements.append(Spacer(1, 4 * mm))


def _birth_line(full_name: str, day: Any, month: Any, year: Any, hour: Any, minute: Any, place: str) -> str:
    try:
        time_str = f"{int(hour):02d}:{int(minute):02d}"
    except (TypeError, ValueError):
        time_str = "-"
    return (
        f"<b>{escape(str(full_name or ''))}</b><br/>"
        f"Born {escape(str(day or '-'))}/{escape(str(month or '-'))}/{escape(str(year or '-'))} "
        f"at {escape(time_str)}, {escape(str(place or ''))}"
    )


_BOLD_RE = re.compile(r"\*\*(.+?)\*\*", re.DOTALL)
_WHOLE_LINE_BOLD_RE = re.compile(r"^\*\*(.+)\*\*$", re.DOTALL)


def _markdown_bold_to_tags(escaped_text: str) -> str:
    """escaped_text must already be XML-escaped — turns **bold** into <b>bold</b>."""
    return _BOLD_RE.sub(r"<b>\1</b>", escaped_text)


def generate_report_pdf(report_type: str, report_data: Dict[str, Any], order_reference: str) -> bytes:
    styles = _styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=20 * mm, bottomMargin=20 * mm, leftMargin=18 * mm, rightMargin=18 * mm,
        title=report_data.get("report_title", "Aadikarta Vedic Report"),
    )

    cover_title_style = ParagraphStyle(
        "AadiCoverTitle", parent=styles["title"], alignment=1, fontSize=22, spaceBefore=14,
    )
    cover_subtitle_style = ParagraphStyle(
        "AadiCoverSubtitle", parent=styles["eyebrow"], alignment=1, fontSize=11,
    )
    elements = [
        Spacer(1, 40 * mm),
    ]
    if os.path.isfile(_GANPATI_IMAGE_PATH):
        img = Image(_GANPATI_IMAGE_PATH, width=60 * mm, height=60 * mm)
        img.hAlign = "CENTER"
        elements.append(img)
        elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph("AADIKARTA VEDIC ASTROLOGY", cover_title_style))
    elements.append(Paragraph("Certified Vedic Analysis &bull; Aadikarta.org", cover_subtitle_style))
    elements.append(PageBreak())

    elements.append(Paragraph("AADIKARTA.ORG &mdash; CERTIFIED VEDIC ANALYSIS", styles["eyebrow"]))
    elements.append(Paragraph(escape(report_data.get("report_title", "Vedic Astrological Report")), styles["title"]))
    elements.append(Paragraph(f"Reference: {escape(order_reference)}", styles["small"]))
    _rule(elements)

    if report_type == "GUN_MILAN":
        p1 = report_data.get("person1", {}) or {}
        p2 = report_data.get("person2", {}) or {}
        match = report_data.get("match_data", {}) or {}

        elements.append(Paragraph("Seeker", styles["heading"]))
        elements.append(Paragraph(_birth_line(p1.get("full_name"), p1.get("day"), p1.get("month"), p1.get("year"), p1.get("hour"), p1.get("minute"), p1.get("place")), styles["body"]))

        elements.append(Paragraph("Partner", styles["heading"]))
        elements.append(Paragraph(_birth_line(p2.get("full_name"), p2.get("day"), p2.get("month"), p2.get("year"), p2.get("hour"), p2.get("minute"), p2.get("place")), styles["body"]))

        elements.append(Paragraph("Guna Milan Score", styles["heading"]))
        score = match.get("score", "-")
        total = match.get("total", 36)
        result = escape(str(match.get("result", "")))
        elements.append(Paragraph(f"<b>{escape(str(score))} / {escape(str(total))}</b> &mdash; {result}", styles["body"]))
    else:
        seeker = report_data.get("seeker_details", {}) or {}
        elements.append(Paragraph(
            f"<b>{escape(str(seeker.get('full_name', '')))}</b><br/>"
            f"Date of Birth: {escape(str(seeker.get('dob', '')))}<br/>"
            f"Time of Birth: {escape(str(seeker.get('tob', '')))}<br/>"
            f"Place of Birth: {escape(str(seeker.get('pob', '')))}",
            styles["body"],
        ))

    if report_type == "FULL_KUNDLI":
        d1_chart = (report_data.get("chart_data") or {}).get("chart") or {}
        if d1_chart.get("houses") and d1_chart.get("planets"):
            elements.append(Paragraph("Birth Chart (Rashi / D1 — North Indian)", styles["heading"]))
            elements.append(_north_indian_chart_drawing(d1_chart, "D1"))
            elements.append(Spacer(1, 3 * mm))

            ascendant = d1_chart.get("ascendant") or {}
            if ascendant:
                nak = ascendant.get("nakshatra") or {}
                asc_line = f"{ascendant.get('sign', '-')} ({ascendant.get('sign_id', '-')})"
                if ascendant.get("degree") is not None:
                    asc_line += f" — {ascendant['degree']:.2f}°"
                if nak.get("name"):
                    asc_line += f" — {nak['name']} Pada {nak.get('pada', '-')}"
                elements.append(Paragraph(f"<b>Lagna (Ascendant):</b> {escape(asc_line)}", styles["body"]))
                elements.append(Spacer(1, 2 * mm))

            elements.append(Paragraph("Planetary Positions", styles["heading"]))
            elements.append(_planets_table(d1_chart.get("planets") or []))
            elements.append(Spacer(1, 3 * mm))

        d9_chart = ((report_data.get("chart_data") or {}).get("vargas") or {}).get("vargas", {}).get("D9") or {}
        if d9_chart.get("houses") and d9_chart.get("planets"):
            elements.append(Paragraph("Navamsa Chart (D9 — Marriage &amp; Spouse)", styles["heading"]))
            elements.append(_north_indian_chart_drawing(d9_chart, "D9"))
            elements.append(Spacer(1, 3 * mm))

        vimshottari = (report_data.get("chart_data") or {}).get("vimshottari_dasha") or {}
        birth_balance = vimshottari.get("birth_balance") or {}
        if birth_balance:
            diff = _calendar_diff(birth_balance.get("birth_date", ""), birth_balance.get("end", ""))
            balance_str = (
                f"{birth_balance.get('lord', '-')} {diff[0]}Y {diff[1]}M {diff[2]}D" if diff
                else str(birth_balance.get("lord", "-"))
            )
            elements.append(Paragraph(f"<b>Dasa Balance at Birth:</b> {escape(balance_str)}", styles["body"]))
            elements.append(Spacer(1, 2 * mm))

        if vimshottari.get("active_periods"):
            elements.append(Paragraph("Vimshottari Dasha — Active Periods", styles["heading"]))
            elements.append(_dasha_table(vimshottari))
            elements.append(Spacer(1, 3 * mm))

        if vimshottari.get("timeline"):
            elements.append(Paragraph("Vimshottari Mahadasha — Full Life Sequence", styles["heading"]))
            elements.append(_mahadasha_timeline_table(vimshottari["timeline"]))

        chart_data_full = report_data.get("chart_data") or {}
        yogas = (chart_data_full.get("yogas") or {}).get("yogas") or []
        manglik = next((y for y in yogas if y.get("id") == "manglik_dosha" or "manglik" in (y.get("name") or "").lower()), None)
        kalasarpa = next((y for y in yogas if y.get("id") == "kala_sarpa_yoga" or "kala sarpa" in (y.get("name") or "").lower()), None)
        active_yogas = [y for y in yogas if y.get("active") and y.get("type") != "dosha"]
        sade_sati = (chart_data_full.get("chart") or {}).get("sade_sati") or {}
        ashtakavarga = chart_data_full.get("ashtakavarga") or {}
        sarva = ashtakavarga.get("sarvashtakavarga")

        if manglik or kalasarpa or active_yogas or sade_sati.get("active") or sarva:
            elements.append(Paragraph("Dosha, Yoga &amp; Strength Analysis", styles["heading"]))

        if manglik:
            elements.append(_status_table("Manglik Dosha", bool(manglik.get("active")), manglik.get("description", ""), icon="manglik"))
            elements.append(Spacer(1, 2 * mm))
            if manglik.get("active"):
                elements.append(_remedies_paragraph("Manglik Dosha", _MANGLIK_REMEDIES, styles["small"]))
            elements.append(Spacer(1, 3 * mm))
        if kalasarpa:
            elements.append(_status_table("Kala Sarpa Yoga", bool(kalasarpa.get("active")), kalasarpa.get("description", ""), icon="kalasarpa"))
            elements.append(Spacer(1, 2 * mm))
            if kalasarpa.get("active"):
                elements.append(_remedies_paragraph("Kala Sarpa Yoga", _KALASARPA_REMEDIES, styles["small"]))
            elements.append(Spacer(1, 3 * mm))

        if sade_sati.get("active"):
            window = sade_sati.get("window") or {}
            desc = sade_sati.get("description", "")
            if window.get("start") and window.get("end"):
                desc = f"{desc} — full cycle approx. {window['start']} to {window['end']}."
            elements.append(_status_table(
                f"Shani Sade Sati — {sade_sati.get('phase', '')} Phase",
                True,
                desc,
                icon="sadesati",
            ))
            elements.append(Spacer(1, 3 * mm))

        if active_yogas:
            names = ", ".join(escape(y.get("name", "")) for y in active_yogas)
            elements.append(Paragraph(f"<b>Active Yogas Detected:</b> {names}", styles["body"]))
            elements.append(Spacer(1, 3 * mm))

        if sarva and len(sarva) == 12:
            elements.append(Paragraph(f"Ashtakavarga — {ashtakavarga.get('total_points', '-')} Total Bindus", styles["small"]))
            elements.append(Spacer(1, 1 * mm))
            elements.append(_ashtakavarga_table(sarva, ashtakavarga.get("total_points")))
            elements.append(Spacer(1, 3 * mm))

    elements.append(Paragraph("AI Synthesized Astrological Reading", styles["heading"]))
    synthesis = report_data.get("ai_synthesis") or "No synthesis content available."
    for para in re.split(r"\n\s*\n", synthesis):
        para = para.strip()
        if not para:
            continue
        whole_line_bold = _WHOLE_LINE_BOLD_RE.match(para)
        if whole_line_bold and "\n" not in whole_line_bold.group(1):
            elements.append(Paragraph(escape(whole_line_bold.group(1)), styles["heading"]))
            continue
        body_html = _markdown_bold_to_tags(escape(para).replace("\n", "<br/>"))
        elements.append(Paragraph(body_html, styles["body"]))
        elements.append(Spacer(1, 2 * mm))

    _rule(elements)
    elements.append(Paragraph(
        "Disclaimer: This report is generated by an AI system based on Vedic astrological principles "
        "and is intended for entertainment and general guidance purposes only. It is not a substitute "
        "for professional financial, legal, medical, or psychological advice, and Aadikarta.org makes "
        "no guarantee of outcome or accuracy. For personalised guidance, please consult a qualified "
        "live astrologer through the platform.",
        styles["small"],
    ))

    doc.build(elements)
    return buffer.getvalue()
