#include <emscripten/bind.h>

#include "parse.h"

ULogData load_ulog(emscripten::val bytesVal, std::string name){
    std::vector<uint8_t> bytes;
    unsigned int length = bytesVal["length"].as<unsigned int>();
    for (unsigned int i = 0; i < length; ++i) {
        bytes.push_back(bytesVal[i].as<uint8_t>());
    }
    return ULogData(bytes, name);
};

emscripten::val get_flight_data(Flight& flight){
    emscripten::val dataVal = emscripten::val::object();
    for (const auto& [topic, field] : flight.data){
        emscripten::val fieldVal = emscripten::val::object();
        emscripten::val timestamps = emscripten::val::array();
        emscripten::val values = emscripten::val::array();
        for (int i = 0; i < field.timestamps.size(); ++i) {
            timestamps.set(i, field.timestamps[i]);
            values.set(i, field.values[i]);
        }
        fieldVal.set("timestamps", timestamps);
        fieldVal.set("values", values);
        dataVal.set(topic, fieldVal);
    }
    return dataVal;
};

using namespace emscripten;

EMSCRIPTEN_BINDINGS(my_module){
    class_<Flight>("Flight")
        .constructor<>()
        .property("name", &Flight::name);
    // .function("get_data", &FlightEMS::get_data);

    class_<Data>("Data");
    class_<ULogData, base<Data>>("ULogData");

    function("load_ulog", &load_ulog);
    function("load_flight", &load_flight);
    function("get_flight_data", &get_flight_data);
}
