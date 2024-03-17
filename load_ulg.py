import pandas as pd
from pyulog.core import ULog

def load_ulg(ulog_file_name, timestamp_field="timestamp_sample", msg_filter=None, disable_str_exceptions=False, verbose=False, relative_timestamps=True):
    ulog = ULog(ulog_file_name, msg_filter, disable_str_exceptions)
    data = ulog.data_list
    df = None
    for d in data:
        data_keys = [f.field_name for f in d.field_data]
        assert(len(data_keys) > 0)
        assert(all([len(d.data[key]) == len(d.data[data_keys[0]]) for key in data_keys]))
        print(f"{d.name} has {len(d.data[data_keys[0]])} entries") if verbose else None
        columns = []
        if timestamp_field in data_keys:
            data_keys.remove(timestamp_field)
        else:
            print(f"Warning: {timestamp_field} not in {d.name}")
            continue

        timestamps = d.data[timestamp_field]
        for key in data_keys:
            column_data = d.data[key]
            new_column = pd.Series(index=timestamps, data=d.data[key], name=f"{d.name}_{key}")
            columns.append(new_column)
        current_df = pd.concat(columns, axis=1, join="inner")
        df = pd.merge(df, current_df, how="outer", left_index=True, right_index=True) if df is not None else current_df
    df.index = df.index / 1e6
    if relative_timestamps:
        df.index = df.index - df.index[0]
    return df



def timeframe(df, time_start, time_end):
    df_timeframe = df[(df.index > time_start) & (df.index < time_end)].copy()
    return df_timeframe