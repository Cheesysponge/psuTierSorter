from tierlist_sorter import sortRegion
from locator import locateRegion
import time

start = time.time()
count = 0
def locateAndSort(region, n):
    global count
    locateRegion(region, n)
    sortRegion(region)
    count += (n-1)*5

locateAndSort("",7)
locateAndSort("au",3)
locateAndSort("de",3)
locateAndSort("uk",3)
locateAndSort("ca",3)


end = time.time()

print(f"Elapsed time: {end - start:.4f} seconds")
print("Used", count, "tokens")
