#include "parse.h"

struct Timeframe{
    TI flight;
    T start;
    T end;
};

std::vector<Flight> extract_timeframes(const std::vector<Flight>& flights, const std::vector<Timeframe>& timeframes){
    std::vector<Flight> output_flights;
    TI timeframe_i = 0;
    for(const Timeframe& timeframe : timeframes){
        const auto& flight = flights[timeframe.flight];
        Flight sub_flight;
        sub_flight.name = flight.name + "." + std::to_string(timeframe_i);
        for(auto& [topic_name, field] : flight.data){
            const auto& timestamps = field.timestamps;
            auto& values = field.values;
            auto start = std::lower_bound(timestamps.begin(), timestamps.end(), timeframe.start);
            auto end = std::upper_bound(timestamps.begin(), timestamps.end(), timeframe.end);
            auto start_index = std::distance(timestamps.begin(), start);
            auto end_index = std::distance(timestamps.begin(), end);
            Flight::Field sub_field;
            sub_field.timestamps = std::vector<T>(timestamps.begin() + start_index, timestamps.begin() + end_index);
            sub_field.values = std::vector<T>(values.begin() + start_index, values.begin() + end_index);
            sub_flight.data[topic_name] = sub_field;
        }
    }
    return output_flights;
}