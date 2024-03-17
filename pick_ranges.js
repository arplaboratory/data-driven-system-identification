import {RangePickerChart} from './range_picker_chart.js';

export async function pickRanges(globals, log_file_paths, flight_data, excitation_metrics, motor_command_topic){
    const range_pickers = []
    for(var log_file_i=0; log_file_i < flight_data.length; log_file_i++){
        const current_excitation_metrics = excitation_metrics[log_file_i];
        const current_flight_data = flight_data[log_file_i];
        const log_file_path = log_file_paths[log_file_i];
        const title_container = document.createElement('h3');
        title_container.textContent = log_file_path;
        const canvas_container = document.createElement('div');
        canvas_container.style.width = "100%";
        canvas_container.style.height = "1000px";
        document.body.appendChild(title_container);
        document.body.appendChild(canvas_container);
        const range_picker_chart = new RangePickerChart(canvas_container);
        range_pickers.push(range_picker_chart)
        const timeseries_motor_commands = [0, 1, 2, 3].map(x=>`${motor_command_topic}_control[${x}]`).map(
            name => ({name, data: current_flight_data[name]})
        )
        const timeseries_groups = [
            {
                name: "Motor Commands",
                timeseries: timeseries_motor_commands
            },
            {
                name: "Thrust Excitation",
                timeseries: [{name: "excitation_thrust", data: current_excitation_metrics.thrust}]
            },
            {
                name: "Torque Excitation (Roll, Pitch)",
                timeseries: [
                    {name: "x", data: current_excitation_metrics.torque_x},
                    {name: "y", data: current_excitation_metrics.torque_y}
                ]
            },
            {
                name: "Torque Excitation (Yaw)",
                timeseries: [
                    {name: "y", data: current_excitation_metrics.torque_z},
                ]
            }
        ]
        range_picker_chart.setTimeSeries(timeseries_groups)

        function resizeCanvas(){
            const dpr = window.devicePixelRatio || 1;
            range_picker_chart.resizeCanvas(dpr);
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }
    const range_input_submit = document.createElement('button')
    range_input_submit.textContent = "Set"

    document.body.appendChild(range_input_submit)
    document.body.appendChild(document.createElement('br'))

    let file_ranges = []
    while(file_ranges.length == 0){
        await new Promise((resolve) => {
            range_input_submit.onclick = resolve;
        })
        file_ranges = []

        for(var log_file_i=0; log_file_i < flight_data.length; log_file_i++){
            const ranges = range_pickers[log_file_i].getSelections()
            for(const range of ranges){
                file_ranges.push({
                    file: log_file_i,
                    start: range.start,
                    end: range.end,
                })
            }
        }
        if(file_ranges.length == 0){
            alert("Please select at least one range")
        }
    }
    return file_ranges
}