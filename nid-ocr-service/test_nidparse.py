# -*- coding: utf-8 -*-
"""
Parser tests on synthetic OCR output modelled on real cards.

The upright card here is a genuine smart card (name, number and date changed only
where noted): its printed layout, the duplicated date in the ghost watermark and the
spaced number are exactly what EasyOCR sees. Run: python3 -m unittest -v
"""
import unittest

import nidparse as P


def box(text, conf, cx, cy, h=30, w=None):
    w = w or (len(text) * 16)
    return ([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2],
             [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], text, conf)


def smart_card_upright(**over):
    """A modern smart card, front, upright, as EasyOCR reads it."""
    name = over.get("name", "HUMAYUN AHMED")
    nid = over.get("nid", "421 296 4672")
    dob = over.get("dob", "17 May 2000")
    return [
        box("গণপ্রজাতন্ত্রী বাংলাদেশ সরকার", 0.55, 700, 40),
        box("Government of the People's Republic of Bangladesh", 0.80, 700, 80, 22),
        box("National ID Card", 0.90, 700, 120),
        box("জাতীয় পরিচয়পত্র", 0.60, 1000, 120),
        box("নাম:", 0.70, 420, 200), box("হুমায়ুন আহমেদ", 0.66, 640, 200),
        box("Name", 0.95, 420, 250), box(name, 0.88, 640, 250),
        box("পিতা:", 0.70, 420, 300), box("মোঃ খোরশেদ আলম", 0.62, 660, 300),
        box("মাতা:", 0.70, 420, 350), box("নুরজাহান বেগম", 0.64, 640, 350),
        box("Date of Birth", 0.90, 470, 420), box(dob, 0.85, 700, 420),
        box("NID No.", 0.90, 440, 480), box(nid, 0.93, 700, 480, 36),
        # ghost watermark repeats the date in tiny type, lower right
        box(dob, 0.40, 1100, 700, 12),
    ]


class SmartCardTest(unittest.TestCase):
    def test_clean_upright_card(self):
        r = P.parse(P.items_from_easyocr(smart_card_upright()))
        f = r["fields"]
        self.assertEqual(f["nameEn"], "HUMAYUN AHMED")
        self.assertEqual(f["nidNumberRaw"], "4212964672")
        self.assertEqual(f["dateOfBirth"], "2000-05-17")
        self.assertEqual(f["nameBn"], "হুমায়ুন আহমেদ")
        self.assertEqual(r["keyFieldsFound"], 3)
        # every key field was found beside its label, not by pattern
        self.assertEqual(r["how"]["nidNumberRaw"], "label")
        self.assertEqual(r["how"]["dateOfBirth"], "label")
        self.assertEqual(r["how"]["nameEn"], "label")
        self.assertAlmostEqual(r["confidence"]["nidNumberRaw"], 0.93)

    def test_dob_label_split_into_three_items(self):
        items = smart_card_upright()
        items = [b for b in items if b[1] != "Date of Birth"]
        items += [box("Date", 0.9, 400, 420), box("of", 0.8, 460, 420), box("Birth", 0.9, 520, 420)]
        f = P.parse(P.items_from_easyocr(items))["fields"]
        self.assertEqual(f["dateOfBirth"], "2000-05-17")

    def test_letter_for_digit_confusion_in_number(self):
        f = P.parse(P.items_from_easyocr(smart_card_upright(nid="42l 296 4O72")))["fields"]
        self.assertEqual(f["nidNumberRaw"], "4212964072")

    def test_label_misread(self):
        items = smart_card_upright()
        items = [b if b[1] != "NID No." else box("NlD N0.", 0.6, 440, 480) for b in items]
        items = [b if b[1] != "Name" else box("Nane", 0.7, 420, 250) for b in items]
        r = P.parse(P.items_from_easyocr(items))
        self.assertEqual(r["fields"]["nidNumberRaw"], "4212964672")
        self.assertEqual(r["fields"]["nameEn"], "HUMAYUN AHMED")
        self.assertEqual(r["how"]["nameEn"], "label")

    def test_name_line_merged_with_next_label_stops_at_label(self):
        # OCR put the name row and the DOB row on one line
        items = [b for b in smart_card_upright() if b[1] not in ("Name", "HUMAYUN AHMED", "Date of Birth", "17 May 2000")]
        y = 250
        items += [box("Name", 0.95, 300, y), box("HUMAYUN", 0.88, 420, y), box("AHMED", 0.88, 520, y),
                  box("Date", 0.9, 640, y), box("of", 0.8, 700, y), box("Birth", 0.9, 760, y),
                  box("17", 0.85, 840, y), box("May", 0.85, 890, y), box("2000", 0.85, 950, y),
                  box("17 May 2000", 0.40, 1100, 700, 12)]
        f = P.parse(P.items_from_easyocr(items))["fields"]
        self.assertEqual(f["nameEn"], "HUMAYUN AHMED")
        self.assertEqual(f["dateOfBirth"], "2000-05-17")

    def test_no_labels_read_at_all_still_no_fabrication(self):
        # Labels lost to glare; only values survive. The birth year "2000" plus the first
        # two groups of the number is a 10-digit string — the old parser returned it.
        items = [
            box("HUMAYUN AHMED", 0.88, 640, 250),
            box("17 May 2000", 0.85, 700, 420),
            box("421 296 4672", 0.93, 700, 480, 36),
            box("2000", 0.4, 1100, 700, 12),
        ]
        r = P.parse(P.items_from_easyocr(items))
        self.assertEqual(r["fields"]["nidNumberRaw"], "4212964672")
        self.assertEqual(r["fields"]["nameEn"], "HUMAYUN AHMED")
        self.assertEqual(r["fields"]["dateOfBirth"], "2000-05-17")
        self.assertEqual(r["how"]["nidNumberRaw"], "pattern")

    def test_never_joins_digits_across_lines(self):
        # A 7-digit fragment on one line and 3 digits on the next: not a number.
        items = [box("Name", 0.9, 400, 250), box("HUMAYUN AHMED", 0.88, 640, 250),
                 box("4212964", 0.9, 700, 480), box("672", 0.9, 700, 540)]
        self.assertIsNone(P.parse(P.items_from_easyocr(items))["fields"]["nidNumberRaw"])

    def test_watermark_date_does_not_override_field(self):
        items = smart_card_upright()
        # watermark misread as a different, valid date
        items = [b if not (b[1] == "17 May 2000" and b[2] == 0.40) else box("11 May 2008", 0.4, 1100, 700, 12) for b in items]
        f = P.parse(P.items_from_easyocr(items))["fields"]
        self.assertEqual(f["dateOfBirth"], "2000-05-17")

    def test_header_is_never_the_name(self):
        items = [box("Government of the People's Republic of Bangladesh", 0.8, 700, 80),
                 box("National ID Card", 0.9, 700, 120),
                 box("NID No.", 0.9, 440, 480), box("421 296 4672", 0.93, 700, 480)]
        self.assertIsNone(P.parse(P.items_from_easyocr(items))["fields"]["nameEn"])

    def test_name_with_honorific_dot(self):
        f = P.parse(P.items_from_easyocr(smart_card_upright(name="MD. ABDUR RAHMAN")))["fields"]
        self.assertEqual(f["nameEn"], "MD. ABDUR RAHMAN")


class OldCardTest(unittest.TestCase):
    def old_card(self, number, dob="01 Jan 1985"):
        return [
            box("National ID Card", 0.9, 600, 60),
            box("Name:", 0.9, 300, 200), box("ABDUL KARIM", 0.85, 520, 200),
            box("Date of Birth:", 0.9, 360, 300), box(dob, 0.85, 620, 300),
            box("ID NO:", 0.9, 320, 360), box(number, 0.9, 640, 360),
        ]

    def test_13_digit_returned_as_printed(self):
        f = P.parse(P.items_from_easyocr(self.old_card("1234567890123")))["fields"]
        self.assertEqual(f["nidNumberRaw"], "1234567890123")
        self.assertEqual(f["dateOfBirth"], "1985-01-01")
        self.assertEqual(f["nameEn"], "ABDUL KARIM")

    def test_17_digit_must_start_with_birth_year(self):
        f = P.parse(P.items_from_easyocr(self.old_card("19851234567890123")))["fields"]
        self.assertEqual(f["nidNumberRaw"], "19851234567890123")
        # a 17-digit run that cannot be a year-prefixed number is not accepted
        f2 = P.parse(P.items_from_easyocr(self.old_card("99991234567890123")))["fields"]
        self.assertIsNone(f2["nidNumberRaw"])

    def test_slash_date(self):
        f = P.parse(P.items_from_easyocr(self.old_card("1234567890123", dob="01/01/1985")))["fields"]
        self.assertEqual(f["dateOfBirth"], "1985-01-01")

    def test_impossible_date_rejected(self):
        f = P.parse(P.items_from_easyocr(self.old_card("1234567890123", dob="31 Feb 1985")))["fields"]
        self.assertIsNone(f["dateOfBirth"])


class BanglaTest(unittest.TestCase):
    def test_bangla_numerals_and_month(self):
        items = [box("জন্ম তারিখ:", 0.7, 400, 420), box("১৭ মে ২০০০", 0.7, 640, 420),
                 box("NID No.", 0.9, 440, 480), box("৪২১ ২৯৬ ৪৬৭২", 0.8, 700, 480)]
        f = P.parse(P.items_from_easyocr(items))["fields"]
        self.assertEqual(f["dateOfBirth"], "2000-05-17")
        self.assertEqual(f["nidNumberRaw"], "4212964672")

    def test_bangla_name_skips_parents(self):
        f = P.parse(P.items_from_easyocr(smart_card_upright()))["fields"]
        self.assertEqual(f["nameBn"], "হুমায়ুন আহমেদ")
        self.assertNotIn("খোরশেদ", f["nameBn"])


class LineOnlyInputTest(unittest.TestCase):
    def test_parses_joined_lines_from_the_current_service(self):
        # What the deployed service returns today: lines only, no geometry.
        lines = ["গণপ্রজাতন্ত্রী বাংলাদেশ সরকার", "Government of the People's Republic of Bangladesh",
                 "National ID Card জাতীয় পরিচয়পত্র", "নাম: হুমায়ুন আহমেদ", "Name HUMAYUN AHMED",
                 "পিতা: মোঃ খোরশেদ আলম", "মাতা: নুরজাহান বেগম", "Date of Birth 17 May 2000",
                 "NID No. 421 296 4672", "17 May 2000"]
        f = P.parse(P.items_from_lines(lines))["fields"]
        self.assertEqual(f["nameEn"], "HUMAYUN AHMED")
        self.assertEqual(f["nidNumberRaw"], "4212964672")
        self.assertEqual(f["dateOfBirth"], "2000-05-17")
        self.assertEqual(f["nameBn"], "হুমায়ুন আহমেদ")


class RealServiceReadTest(unittest.TestCase):
    """The live service's actual output for a real smart card, after rotation fixed it."""
    REAL = ["গণপ্রজাতন্তট্রী বাংলাদেশ সরকার",
            "জাতীয় পরিচয়পত্র Government of the People's Republic of Bangladesh National ID Card",
            "47 (H3} 2000", "হুমায়ুন আহমেদ", "IName", "HUNIAYUNAHIIED", "পিতা", "মোঃ খোরশবেদ সনম",
            "মাত]", "নুরজাহান বেগম", "Date or Birth 17 Maj 2008:", "হরূমা১ন ৩-মদ NID No 421 296 4672"]

    def test_real_read(self):
        r = P.parse(P.items_from_lines(self.REAL))
        f = r["fields"]
        self.assertEqual(f["nidNumberRaw"], "4212964672")
        self.assertEqual(f["nameBn"], "হুমায়ুন আহমেদ")
        # "IName" is the label; the value is what the engine read, fused, for the form to fix
        self.assertEqual(f["nameEn"], "HUNIAYUNAHIIED")
        self.assertEqual(r["how"]["nameEn"], "label")
        # field says 2008, watermark says 2000: disputed, so not filled in
        self.assertIsNone(f["dateOfBirth"])
        self.assertEqual(r["how"]["dateOfBirth"], "disputed")

    def test_month_confusions(self):
        self.assertEqual(P._month_from("Maj"), 5)
        self.assertEqual(P._month_from("Mav"), 5)
        self.assertEqual(P._month_from("0ct"), 10)
        self.assertEqual(P._month_from("Mar"), 3)
        self.assertIsNone(P._month_from("Mxy"))   # a full step from May, Mar and more

    def test_agreeing_copies_are_not_disputed(self):
        lines = ["Date of Birth 17 May 2000", "NID No 421 296 4672", "17 May 2000"]
        r = P.parse(P.items_from_lines(lines))
        self.assertEqual(r["fields"]["dateOfBirth"], "2000-05-17")


class OrientationTest(unittest.TestCase):
    def test_reading_with_fields_beats_sideways_junk(self):
        good = P.items_from_easyocr(smart_card_upright())
        junk = P.items_from_easyocr([box("Gvrnmnt", 0.9, 100, 100), box("ppls rpblc", 0.9, 100, 200),
                                     box("xkq wzv", 0.95, 100, 300), box("Ntnl", 0.9, 100, 400)] * 10)
        self.assertGreater(P.orientation_score(good, P.parse(good)), P.orientation_score(junk, P.parse(junk)))


if __name__ == "__main__":
    unittest.main()
