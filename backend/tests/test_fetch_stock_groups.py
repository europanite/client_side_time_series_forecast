import importlib.util
import sys
import unittest
import tempfile
from datetime import date, timedelta
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
path = root / 'fetch_stock_groups.py'
spec = importlib.util.spec_from_file_location('fetch_stock_groups', path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class GroupCollectionTests(unittest.TestCase):
    def setUp(self):
        days = [(date(2025, 1, 1) + timedelta(days=i)).isoformat() for i in range(300)]
        self.days = days
        self.prices = {
            'AAA.T': {d: (i+100., i+101.) for i, d in enumerate(days)},
            'BBB.T': {d: (i+200., i+201.) for i, d in enumerate(days)},
            'JPY=X': {days[2]: (149., 150.)},
        }

    def test_dynamic_targets_and_sparse_optional_factors(self):
        targets, cols, days, panel, opens = mod.build_panel(
            self.prices, {'test_group': ['AAA.T', 'BBB.T']})
        self.assertEqual(targets, ['AAA.T','BBB.T'])
        self.assertEqual(cols, ['AAA.T','BBB.T','JPY=X'])
        self.assertEqual(len(days), 300)
        self.assertTrue(panel.decode().startswith('Date,AAA.T,BBB.T,JPY=X\n'))
        self.assertIn(f'{days[0]},101,201,\n', panel.decode())
        self.assertTrue(opens.decode().startswith('Date,AAA.T_Open,BBB.T_Open\n'))

    def test_target_missing_sessions_are_never_imputed(self):
        del self.prices['BBB.T'][self.days[4]]
        targets, _, days, _, _ = mod.build_panel(self.prices, {'g':['AAA.T','BBB.T']})
        self.assertEqual(len(targets),2)
        self.assertNotIn(self.days[4],days)

    def test_reject_insufficient_history(self):
        with self.assertRaises(ValueError):
            mod.build_panel(self.prices, {'g':['AAA.T','BBB.T']}, min_bars=400)

    def test_atomic_write_updates_only_changed_snapshots(self):
        with tempfile.TemporaryDirectory() as folder:
            destination = Path(folder) / "nested" / "market.csv"
            first = b"Date,AAA.T\n2026-10-07,101\n"
            self.assertTrue(mod.write_if_changed(destination, first))
            self.assertFalse(mod.write_if_changed(destination, first))
            self.assertEqual(destination.read_bytes(), first)
            self.assertTrue(mod.write_if_changed(destination, first + b"2026-10-08,102\n"))
            self.assertEqual(list(destination.parent.glob("*.tmp")), [])

    def test_repo_root_resolves_from_collector(self):
        self.assertEqual(mod.REPO_ROOT, root.parent)

    def test_no_same_target_in_sector_factor_list(self):
        for group in mod.SECTORS.values():
            self.assertEqual(len(group),len(set(group)))
        self.assertGreaterEqual(sum(map(len,mod.SECTORS.values())), 10)


if __name__=='__main__':
    unittest.main()
