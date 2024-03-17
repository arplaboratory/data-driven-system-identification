```
git submodule update --init
./download_cfusdlog.sh
```

import json
from json import JSONEncoder

class NumpyArrayEncoder(JSONEncoder):
def default(self, obj):
if isinstance(obj, np.ndarray):
return obj.tolist()
return super().default(obj)
with open(f"{model_name}_flights_thrust_timeframes", "w") as f:
f.write(json.dumps(flights_thrust, cls=NumpyArrayEncoder))