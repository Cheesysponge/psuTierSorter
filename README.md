# PSU Tierlist Sorter (AKA PSU Finder 9000)
Some code that takes in formatted powersupply data and find the cheapest ones for each tier based on SPLs PSU tierlist


# READ BEFORE USE
This code has a scraper for PCPartpicker but that will require a Zenrows API key (which has 1.1k free requests). I do not include the data from PCPP because scraping their website is against their TOS

This does not come with the PSU tierlist data, if you would like access to it, go here: https://docs.google.com/spreadsheets/d/1akCHL7Vhzk_EhrpIGkz8zTEvYfLDcaSpZRB6Xt6JWkc/edit?gid=1973454078#gid=1973454078


# Python Functionality
Without this extra data, this still has the latest data (from 7/11/2025) of which is the cheapest PSU for each tier

You can run the **cheapest.py** file and it will take in a wattage input and then give you the cheapest from each tier, C* to A+.

It will print this out into the console as well as storing it in cheapest.csv

# Website 

The PSU Finding Tool website stores a cached version of the cheapest PSUs for each tier for easy access(It scans the cheapest.csv file).

# ⚠️ Warning ⚠️
This code is trying to do something that is very difficult and it is _far_ from perfect. 

There are many, many powersupplies with similar names that are vastly different in quality which makes this a difficult task to automate.

An example of this is the Thermaltake Toughpower series which has over 60 PSUs that are all called Thermaltake Toughpower and are ranging from F to A+ in quality

Here is an image of the tierlist showing what I mean:


![tierlistImage](https://github.com/user-attachments/assets/001303fc-d744-4aa9-b173-2a8d9ced42d5)


This code does its best to make an educated guess based on a limited amount of data.
