from tierlist_sorter import sortRegion
from locator import locateRegion

count = 0
def locateAndSort(region, n):
    global count
    locateRegion(region, n)
    sortRegion(region)
    count += (n-2)*5

locateAndSort("",4)
locateAndSort("au",3)
locateAndSort("de",3)
locateAndSort("uk",3)
locateAndSort("ca",3)
print("Used", count, "tokens")
