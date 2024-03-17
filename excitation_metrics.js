
function cross(x, y){
    return [
        x[1]*y[2] - x[2]*y[1],
        x[2]*y[0] - x[0]*y[2],
        x[0]*y[1] - x[1]*y[0]
    ]
}

export function getExcitationMetrics(model, flight_data, actuator_motors_topic) {
    const timeseries_motor_commands = [0, 1, 2, 3].map(x=>`${actuator_motors_topic}_control[${x}]`).map(
        name => ({name, data: flight_data[name]})
    )

    const torque_vectors = [0, 1, 2, 3].map(motor_i => {
        return cross(model["rotor_positions"][motor_i], model["rotor_thrust_directions"][motor_i])
    })
    const thrusts = []
    const torques_x = []
    const torques_y = []
    const torques_z = []
    for(let step_i=0; step_i<timeseries_motor_commands[0].data["timestamps"].length; step_i++) {
        let thrust = 0;
        let torque = [0, 0, 0];
        let torque_drag = 0;
        for(let motor_i=0; motor_i<4; motor_i++) {
            const motor_command = timeseries_motor_commands[motor_i].data["values"][step_i]
            const thrust_vector = model["rotor_thrust_directions"][motor_i]
            thrust += motor_command * thrust_vector[2]
            torque = torque_vectors[motor_i].map((x, i) => x * motor_command + torque[i])
            torque_drag += motor_command * model["rotor_torque_directions"][motor_i][2]

        }
        thrusts.push(thrust)
        torques_x.push(torque[0])
        torques_y.push(torque[1])
        torques_z.push(torque_drag)
    }
    return {
        thrust: {timestamps: timeseries_motor_commands[0].data.timestamps, values: thrusts},
        torque_x: {timestamps: timeseries_motor_commands[0].data.timestamps, values: torques_x},
        torque_y: {timestamps: timeseries_motor_commands[0].data.timestamps, values: torques_y},
        torque_z: {timestamps: timeseries_motor_commands[0].data.timestamps, values: torques_z}
    }
}