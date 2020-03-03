import requests
import sys
print 'Deleting one week old or older data'
DELETE_ENDPOINT = "http://imd.utdallas.edu:3000/wind_data/old"
try:
    r = requests.delete(url = DELETE_ENDPOINT)
except requests.exceptions.RequestException as e:
    print e
    sys.exit(1)
print r.text
