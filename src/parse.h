#ifndef PARSE_H
#define PARSE_H
#include <fstream>
#include <iostream>
#include <string>
#include <ulog_cpp/data_container.hpp>
#include <ulog_cpp/reader.hpp>
#include <cassert>


using T = double;
using TI = uint64_t;
constexpr bool VERBOSE = false;

constexpr double TIMESTAMP_CONSTANT = 1e-6;


struct Flight{
    struct Field{
        std::vector<T> timestamps;
        std::vector<T> values;
    };
    std::string name;
    std::map<std::string, Field> data;
};

struct Data{
    virtual Flight::Field read_field(std::string topic_name, std::string field_name, TI index) = 0;
    virtual std::string get_name() = 0;
};

struct ULogData: Data{
    std::string name;
    std::shared_ptr<ulog_cpp::DataContainer> data_container;
    std::set<std::string> subscription_names;
    ULogData(std::vector<uint8_t> data, std::string name);
    virtual Flight::Field read_field(std::string topic_name, std::string field_name, TI index) override;
    std::string get_name() override{return name;} ;
};

ULogData::ULogData(std::vector<uint8_t> data, std::string name){
    this->name = name;
    this->data_container = std::make_shared<ulog_cpp::DataContainer>(ulog_cpp::DataContainer::StorageConfig::FullLog);
    ulog_cpp::Reader reader{this->data_container};
    reader.readChunk(data.data(), data.size());
    subscription_names = this->data_container->subscriptionNames();
    if(VERBOSE){
        std::cout << "Subscriptions: " << "\n";
        for (const auto& sub : subscription_names) {
            std::cout << sub << "\n";
        }
        std::cout << "\n";
    }
}

Flight::Field ULogData::read_field(std::string topic_name, std::string field_name, TI index){

    Flight::Field field;

    if (subscription_names.find(topic_name) != subscription_names.end()) {
        const auto& subscription = this->data_container->subscription(topic_name);

        auto message_format = subscription->format();
        assert(message_format->field(field_name)->type().name == "float");
        assert(message_format->field(field_name)->arrayLength() > index);
        if(VERBOSE){
            std::cout << "Message format: " << message_format->name() << "\n";
            std::cout << "Field names: " << "\n";
            for (const auto& field_name : message_format->fieldNames()) {
                auto field = message_format->field(field_name);
                std::cout << "  " << field->name() << ": " << field->type().name << "[" << field->arrayLength() << "]" << "\n";
            }
        }

        std::string timestamp_field_name = "timestamp";

        auto timestamp_field = subscription->field(timestamp_field_name);
        auto value_field = subscription->field(field_name);

        uint64_t first_timestamp = 0;
        bool first_timestamp_set = false;
        for (const auto& sample : *subscription) {
            auto timestamp = sample[timestamp_field].as<uint64_t>();
            if(!first_timestamp_set){
                first_timestamp = timestamp;
                first_timestamp_set = true;
            }
            auto value = sample[value_field][index].as<T>();
            field.timestamps.push_back((timestamp - first_timestamp) * TIMESTAMP_CONSTANT);
            field.values.push_back(value);
        }
    } else {
        std::cout << "No vehicle_status subscription found\n";
        throw std::runtime_error("No vehicle_status subscription found");
    }
    return field;
}


void read_flight(Data& data_source, Flight& flight){
    flight.data["actuator_motors_mux_control[0]"] = data_source.read_field("actuator_motors_mux", "control", 0);
    flight.data["actuator_motors_mux_control[1]"] = data_source.read_field("actuator_motors_mux", "control", 1);
    flight.data["actuator_motors_mux_control[2]"] = data_source.read_field("actuator_motors_mux", "control", 2);
    flight.data["actuator_motors_mux_control[3]"] = data_source.read_field("actuator_motors_mux", "control", 3);

    flight.data["vehicle_acceleration_xyz[0]"] = data_source.read_field("vehicle_acceleration", "xyz", 0);
    flight.data["vehicle_acceleration_xyz[1]"] = data_source.read_field("vehicle_acceleration", "xyz", 1);
    flight.data["vehicle_acceleration_xyz[2]"] = data_source.read_field("vehicle_acceleration", "xyz", 2);

    flight.data["vehicle_angular_velocity_xyz[0]"] = data_source.read_field("vehicle_angular_velocity", "xyz", 0);
    flight.data["vehicle_angular_velocity_xyz[1]"] = data_source.read_field("vehicle_angular_velocity", "xyz", 1);
    flight.data["vehicle_angular_velocity_xyz[2]"] = data_source.read_field("vehicle_angular_velocity", "xyz", 2);

    flight.data["vehicle_angular_velocity_xyz_derivative[0]"] = data_source.read_field("vehicle_angular_velocity", "xyz_derivative", 0);
    flight.data["vehicle_angular_velocity_xyz_derivative[1]"] = data_source.read_field("vehicle_angular_velocity", "xyz_derivative", 1);
    flight.data["vehicle_angular_velocity_xyz_derivative[2]"] = data_source.read_field("vehicle_angular_velocity", "xyz_derivative", 2);

    flight.name = data_source.get_name();
}


#endif