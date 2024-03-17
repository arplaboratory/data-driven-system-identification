# Download
```
git clone --recursive https://github.com/arplaboratory/data-driven-system-identification.git
```
# Install
```
cd data-driven-system-identification
./download_cfusdlog.sh
```

# Run
```
jupyter lab
```
Open [sysid.ipynb](sysid.ipynb)





import json
from json import JSONEncoder

class NumpyArrayEncoder(JSONEncoder):
def default(self, obj):
if isinstance(obj, np.ndarray):
return obj.tolist()
return super().default(obj)
with open(f"{model_name}_flights_thrust_timeframes", "w") as f:
f.write(json.dumps(flights_thrust, cls=NumpyArrayEncoder))