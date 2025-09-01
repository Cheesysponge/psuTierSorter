from tierlist_sorter import sortRegion
import time

start = time.time()



sortRegion("")
sortRegion("au")
sortRegion("de")
sortRegion("uk")
sortRegion("ca")
end = time.time()

print(f"Elapsed time: {end - start:.4f} seconds")
