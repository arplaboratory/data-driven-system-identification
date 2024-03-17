#include "parse.h"
#include "extract_timeframes.h"
#include <nlohmann/json>

int load_flight(Flight& flight, const std::string& path){

    std::ifstream file(path, std::ios::binary);
    if (!file) {
        std::cerr << "Opening file failed\n";
        return -1;
    }
    file.seekg(0, std::ios::end);
    std::size_t fileSize = file.tellg();
    std::vector<uint8_t> buffer(fileSize);
    file.seekg(0, std::ios::beg);
    file.read(reinterpret_cast<char*>(buffer.data()), fileSize);
    file.close();

    ULogData data_source(buffer, path);
    read_flight(data_source, flight);
    return 0;
}

int main(int argc, char* argv[]) {

    std::vector<std::string> log_file_paths = {
        "logs_large/log_63_2024-1-8-16-37-54.ulg",
        "logs_large/log_64_2024-1-8-16-39-44.ulg",
        "logs_large/log_65_2024-1-8-16-40-52.ulg",
        "logs_large/log_66_2024-1-8-16-42-48.ulg"
    };

    std::vector<Flight> flights;

    for(const std::string& log_file_path : log_file_paths){
        Flight flight;
        load_flight(flight, log_file_path);
        flights.push_back(flight);
    }

    std::vector<Timeframe> timeframes = {
        {0, 10, 45}
    };

    std::vector<Flight> sub_flights = extract_timeframes(flights, timeframes);



    return 0;
}
