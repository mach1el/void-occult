import ephem
from datetime import datetime

sun = ephem.Sun()
# Find next equinox/solstice and calculate exactly when longitude is 315
for year in [2024, 2025, 2026]:
    # Lập xuân is approx Feb 4
    d = ephem.Date(f'{year}/02/01')
    def get_lon(date):
        sun.compute(date)
        # return apparent geocentric ecliptic longitude in degrees
        return float(ephem.Ecliptic(sun).lon) * 180 / ephem.pi
    
    # Simple binary search
    low = ephem.Date(f'{year}/02/01')
    high = ephem.Date(f'{year}/02/08')
    for _ in range(50):
        mid = ephem.Date((low + high) / 2)
        lon = get_lon(mid)
        if lon > 320: lon -= 360  # Handle crossing 0 if needed (not needed for 315)
        if lon < 315:
            low = mid
        else:
            high = mid
            
    print(f"Year {year} Li Chun UTC: {ephem.Date(mid).datetime()}")
