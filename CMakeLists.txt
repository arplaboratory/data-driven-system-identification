
add_subdirectory(external/ulog_cpp)
add_executable(parse src/parse.cpp)
target_link_libraries(
        parse
        ulog_cpp::ulog_cpp
)
target_compile_features(parse PRIVATE cxx_std_17)

