
function zip(...arrays) {
    const length = Math.min(...arrays.map(arr => arr.length));
    return Array.from({ length }, (_, i) => arrays.map(arr => arr[i]));
}
function formatNumberToExponential(number) {
    let formattedNumber = number.toExponential(1);
    formattedNumber = formattedNumber.replace("e+", "e");
    return formattedNumber;
}
class RangePickerChart{
    constructor(parent_element){
        this.parent_element = parent_element;
        this.container = document.createElement('div');
        this.container.classList.add('range-picker-chart');
        this.canvas = document.createElement('canvas');
        this.overlay_canvas = document.createElement('canvas');
        for (const canvas of [this.canvas, this.overlay_canvas]) {
            canvas.style.position = 'absolute';
            canvas.style.top = 0;
            canvas.style.left = 0;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.margin = 'auto';
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.overlay_canvas);
        this.parent_element.appendChild(this.container);
        this.ctx = this.canvas.getContext('2d');
        this.overlay_ctx = this.overlay_canvas.getContext('2d');
        this.dpr = 1;
        this.label_scale = 2
        this.timeseries = null

        this.timestamp_min = null;
        this.timestamp_max = null;

        this.color_palette = [
            "#0077b6",
            "#f4a261",
            "#2a9d8f",
            "#6a4c93",
            "#e76f51",
            "#2d6a4f",
            "#f9c74f",
            "#8d99ae",
        ]

        this.margin = 20 * this.label_scale;
        this.margin_left = this.margin * 2;
        this.inner_margin_x = 0;
        this.inner_margin_y = 10;

        this.subplot_positions = []

        this.is_selecting = false;
        this.start_timestamp = 0;
        this.current_timestamp = 0;
        this.overlay_canvas.addEventListener('mousedown', this.startSelection.bind(this));
        this.overlay_canvas.addEventListener('mousemove', this.moveSelection.bind(this));
        this.overlay_canvas.addEventListener('mouseup', this.endSelection.bind(this));
        this.overlay_canvas.addEventListener('mouseleave', this.endSelection.bind(this));

        this.selections = []
    }
    set_selections(selections){
        this.selections = selections
        this.drawOverlay()
    }
    x_scale(subplot, x0, x1, x){
        const x_range = x1 - x0
        return (x - subplot.timestamp_min) / (subplot.timestamp_max - subplot.timestamp_min) * (x_range - 2*this.inner_margin_x) + x0 + this.inner_margin_x;
    }
    y_scale(subplot, y0, y1, y){
        const y_range = y1 - y0
        return (1 - ((y - subplot.value_min) / (subplot.value_max - subplot.value_min))) * (y_range - 2*this.inner_margin_y) + y0 + this.inner_margin_y;
    }

    x_unscale(x){
        return (x - this.margin_left - this.inner_margin_x) / (this.overlay_canvas.width / this.dpr - this.margin_left - this.margin + 2*this.inner_margin_x) * (this.timestamp_max - this.timestamp_min) + this.timestamp_min;
    }
    startSelection(event) {
        this.is_selecting = true;
        const rect = event.target.getBoundingClientRect();
        this.start_timestamp = this.x_unscale(event.clientX - rect.left)
        this.start_timestamp = Math.max(this.start_timestamp, this.timestamp_min)
        this.start_timestamp = Math.min(this.start_timestamp, this.timestamp_max)
        this.current_timestamp = this.start_timestamp;
    }
    
    moveSelection(event) {
        if (!this.is_selecting) return;
        const rect = event.target.getBoundingClientRect();
        this.current_timestamp = this.x_unscale(event.clientX - rect.left);
        this.current_timestamp = Math.max(this.current_timestamp, this.timestamp_min)
        this.current_timestamp = Math.min(this.current_timestamp, this.timestamp_max)
        this.drawOverlay();
    }
    
    endSelection() {
        if(this.is_selecting){
            this.is_selecting = false;
            const start_x_timestamp = this.start_timestamp < this.current_timestamp ? this.start_timestamp : this.current_timestamp
            const end_x_timestamp = this.start_timestamp < this.current_timestamp ? this.current_timestamp : this.start_timestamp
            const relative_range = (end_x_timestamp - start_x_timestamp) / (this.timestamp_max - this.timestamp_min)
            console.log("range", start_x_timestamp, end_x_timestamp, relative_range)
            let click = false
            if(this.start_timestamp !== this.current_timestamp){
                if(relative_range > 0.02){
                    this.set_selections([...this.selections, {"start": start_x_timestamp, "end": end_x_timestamp}])
                }
                else{
                    click = true
                }
            }
            else{
                click = true
            }
            if(click){
                const timestamp = start_x_timestamp
                console.log("click timestamp ", timestamp)
                this.set_selections(this.selections.filter((selection) => {
                    return selection.start > timestamp || selection.end < timestamp
                }))
                console.log("click")
            }
            this.drawOverlay()
        }
    }

    drawOverlay() {
        this.overlay_ctx.clearRect(0, 0, this.overlay_canvas.width, this.overlay_canvas.height); // Clear previous overlay
        const width = this.canvas.width / this.dpr;
        const height = this.canvas.height / this.dpr;

        const subplot_height = (height - this.margin) / this.subplots.length;

        let current_y0 = 0
        for(const subplot of this.subplots){
            const x0 = this.margin_left;
            this.x0 = x0
            const y0 = current_y0 + this.margin;
            const x1 = width - this.margin;
            this.x1 = x1
            const y1 = current_y0 + subplot_height - this.margin;
            const x_range = x1 - x0;
            const y_range = y1 - y0;
            this.overlay_ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
            for(const selection of this.selections){
                const start_x = this.x_scale(subplot, x0, x1, selection.start);
                const end_x = this.x_scale(subplot, x0, x1, selection.end);
                this.overlay_ctx.fillRect(start_x, y0, end_x - start_x, y_range); 
            }

            if (this.is_selecting){
                const start = this.x_scale(subplot, x0, x1, this.start_timestamp);
                const end = this.x_scale(subplot, x0, x1, this.current_timestamp);
                this.overlay_ctx.fillRect(start, y0, end - start, y_range);
            }
            current_y0 += subplot_height
        }
    }
    // click(event){
    //     // find timestamp 
    //     const rect = event.target.getBoundingClientRect();
    //     const x = event.clientX - rect.left;
    //     const timestamp = x / this.overlay_canvas.width * (this.timestamp_max - this.timestamp_min) + this.timestamp_min
    //     this.selections = this.selections.filter((selection) => {
    //         return selection.start <= timestamp && timestamp <= selection.end
    //     })
    //     console.log("click")
    //     this.drawOverlay()
    // }
    
    setTimeSeries(timeseries_groups){
        this.timeseries_groups = timeseries_groups
        this.subplots = this.timeseries_groups.map((timeseries_group) => {
            let timestamp_min = null
            let timestamp_max = null
            let value_min = null
            let value_max = null
            timeseries_group.timeseries.forEach((timeseries) => {
                const current_timestamp_min = timeseries.data["timestamps"][0];
                const current_timestamp_max = timeseries.data["timestamps"][timeseries.data["timestamps"].length - 1];
                const current_value_min = timeseries.data["values"].reduce((a, b) => Math.min(a, b), 0);
                const current_value_max = timeseries.data["values"].reduce((a, b) => Math.max(a, b), 0);
                if(timestamp_min == null){
                    timestamp_min = current_timestamp_min
                    timestamp_max = current_timestamp_max
                    value_min = current_value_min
                    value_max = current_value_max
                }
                else{
                    timestamp_min = Math.min(timestamp_min, current_timestamp_min)
                    timestamp_max = Math.max(timestamp_max, current_timestamp_max)
                    value_min = Math.min(value_min, current_value_min)
                    value_max = Math.max(value_max, current_value_max)
                }
            })
            return {
                "timeseries": timeseries_group.timeseries,
                "timestamp_min": timestamp_min,
                "timestamp_max": timestamp_max,
                "value_min": value_min,
                "value_max": value_max,
            }
        })
        this.timestamp_min = this.subplots.reduce((a, b) => Math.min(a, b.timestamp_min), this.subplots[0].timestamp_min)
        this.timestamp_max = this.subplots.reduce((a, b) => Math.max(a, b.timestamp_max), this.subplots[0].timestamp_max)
        this.set_selections([])
    }
    x_tick_label(x){
        return `${x.toFixed(0)}`
    }
    y_tick_label(y){
        return formatNumberToExponential(y)
    }
    draw(){
        const width = this.canvas.width / this.dpr;
        const height = this.canvas.height / this.dpr;

        const subplot_height = (height - this.margin) / this.subplots.length;

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, width, height);
        this.overlay_ctx.clearRect(0, 0, width, height);

        let current_y0 = 0
        for(const subplot of this.subplots){

            const x0 = this.margin_left;
            const y0 = current_y0 + this.margin;
            const x1 = width - this.margin;
            const y1 = current_y0 + subplot_height - this.margin;
            const x_range = x1 - x0;
            const y_range = y1 - y0;

            current_y0 += subplot_height



            // frame
            this.ctx.beginPath();
            this.ctx.moveTo(x0, y0);
            this.ctx.lineTo(x1, y0);
            this.ctx.lineTo(x1, y1);
            this.ctx.lineTo(x0, y1);
            this.ctx.lineTo(x0, y0);
            this.ctx.stroke();


            this.ctx.font = `${10 * this.label_scale}px Arial`;
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            const label_offset = this.margin/2
            this.ctx.fillText("Time", x0 + x_range/2, y1 + label_offset);
            this.ctx.save();

            this.ctx.translate(x0 - label_offset, y_range/2 + y0);
            this.ctx.rotate(-Math.PI / 2);

            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText("Value", 0, 0);

            this.ctx.restore();


            if(subplot.timeseries){
                let color_i = 0
                subplot.timeseries.forEach((timeseries) => {
                    const color = this.color_palette[color_i % this.color_palette.length]
                    this.ctx.strokeStyle = color;
                    this.ctx.beginPath();
                    for (let i = 0; i < timeseries.data["timestamps"].length; i++) {
                        const x = this.x_scale(subplot, x0, x1, timeseries.data["timestamps"][i]);
                        const y = this.y_scale(subplot, y0, y1, timeseries.data["values"][i]);
                        if (i == 0) {
                            this.ctx.moveTo(x, y);
                        } else {
                            this.ctx.lineTo(x, y);
                        }
                    }
                    this.ctx.stroke();
                    color_i += 1
                })
                this.ctx.textBaseline = 'top';
                this.ctx.textAlign = 'left';
                const tick_label_offset = this.margin/10
                this.ctx.fillText(this.x_tick_label(subplot.timestamp_min), x0, y1 + tick_label_offset);
                this.ctx.textAlign = 'right';
                this.ctx.fillText(this.x_tick_label(subplot.timestamp_max), x1, y1 + tick_label_offset);
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(this.y_tick_label(subplot.value_min), x0 - tick_label_offset, y1);
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(this.y_tick_label(subplot.value_max), x0 - tick_label_offset, y0);

                this.ctx.textBaseline = 'bottom';
                this.ctx.textAlign = 'left';
                let current_pos = x0
                const legend_margin = this.margin/2
                let legend_i = 0
                subplot.timeseries.forEach((timeseries) => {
                    this.ctx.fillStyle = this.color_palette[legend_i % this.color_palette.length];
                    this.ctx.fillText(timeseries.name, current_pos, y0 - tick_label_offset);
                    current_pos += this.ctx.measureText(timeseries.name).width + legend_margin
                    legend_i += 1
                })
            }
        }

    }
    resizeCanvas(dpr){
        this.dpr = dpr;
        this.canvas.style.width = this.container.offsetWidth + 'px';
        this.canvas.style.height = this.container.offsetHeight + 'px';
        this.canvas.width = this.container.offsetWidth * dpr;
        this.canvas.height = this.container.offsetHeight * dpr;

        this.overlay_canvas.style.width = this.container.offsetWidth + 'px';
        this.overlay_canvas.style.height = this.container.offsetHeight + 'px';
        this.overlay_canvas.width = this.container.offsetWidth * dpr;
        this.overlay_canvas.height = this.container.offsetHeight * dpr;

        this.ctx.scale(dpr, dpr);
        this.overlay_ctx.scale(dpr, dpr);
        this.draw()
        this.drawOverlay()
    }
    getSelections(){
        return this.selections
    }
}


export { RangePickerChart }