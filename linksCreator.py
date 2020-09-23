
# A Python program to print all  
# permutations of given length 
from itertools import permutations 
  
# Get all permutations of length 2 
# and length 2 
ct=[55025000902,55025001102,55025001606,55025001705,55025001804,55025000901,55025001101,55025001605,55025001704,55025001604,55025001603,55025001802,55025000300,55025000800,55025001000,55025003200,55025010100,55025001200,55025001300,55025001900,55025002100]

perm = permutations(ct, 2) 
  
# Print the obtained permutations 
for i in list(perm): 
    print (i) 
