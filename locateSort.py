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

locateAndSort("",5)
locateAndSort("au",3)
locateAndSort("de",4)
locateAndSort("uk",3)
locateAndSort("ca",4)


end = time.time()

print(f"Elapsed time: {end - start:.4f} seconds")
print("Used", count, "tokens")
