# PSU Tierlist Sorter (AKA PSU Finder 9000)
Some code that takes in formatted powersupply data and find the cheapest ones for each tier based on SPLs PSU tierlist


# READ BEFORE USE
I do not include the data from PCPP because scraping their website is against their TOS, if you would like to you may manually source data(or break their rules and scrape them).

This does not come with the PSU tierlist data, if you would like access to it, go here: https://docs.google.com/spreadsheets/d/1akCHL7Vhzk_EhrpIGkz8zTEvYfLDcaSpZRB6Xt6JWkc/edit?gid=1973454078#gid=1973454078
I have explicit permission from the creator to use his data for this project.


# Python Functionality
Without this extra data, this still has the latest(approximately) data of which is the cheapest PSU for each tier

All of the information is stored in psu_stored.csv so if you would like to process it, you may do that. Most of the functionality of the python is to match the PSUs to the one on the tierlist

# Website 

The PSU Finding Tool website stores a cached version of the cheapest PSUs for each tier for easy access(It scans the psu_stored.csv file).

# ⚠️ Warning ⚠️
This code is trying to do something that is very difficult and it is _far_ from perfect. 

There are many, many powersupplies with similar names that are vastly different in quality which makes this a difficult task to automate.

An example of this is the Thermaltake Toughpower series which has over 60 PSUs that are all called Thermaltake Toughpower and are ranging from F to A+ in quality

Here is an image of the tierlist showing what I mean:


![tierlistImage](https://github.com/user-attachments/assets/001303fc-d744-4aa9-b173-2a8d9ced42d5)


This code does its best to make an educated guess based on a limited amount of data.
