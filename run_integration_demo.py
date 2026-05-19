#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to project directory
os.chdir(r'C:\Users\User\IdeaProjects\distributed_cad_versioning')

# Run Java with proper classpath
classpath = 'target;lib/gson-2.10.1.jar'
main_class = 'org.example.IntegrationDemo'

cmd = ['java', '-cp', classpath, main_class]
print(f"Running: {' '.join(cmd)}")
print(f"Working directory: {os.getcwd()}")
print()

result = subprocess.run(cmd)
sys.exit(result.returncode)

