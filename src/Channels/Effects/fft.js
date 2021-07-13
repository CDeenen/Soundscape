export class FFT {
    constructor(channel,context) {
        this.context = context;
        this.node = context.createAnalyser();
        channel.effects.pan.node.connect(this.node)
        this.node.fftSize = 16384;
        this.bufferLength = this.frequencyBinCount;
        this.canvas;
        this.canvasCtx;

        this.ready = false;

       this.node.maxDecibels = -0;
       this.node.minDecibels = -60;
       this.node.smoothingTimeConstant = 0.25;
       this.decibelRange = 100;
       this.horLines = this.decibelRange/10 + 2;

       this.horOffset = 25;
       this.vertOffset = 20;
       this.minFreq = 20;

       this.freqArray = [];
       this.freqArray[0] = 20;
       
       this.maxFreq = this.freqArray[this.freqArray.length];

       this.vertNumArray = [20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000,20000]
       this.vertNumTextArray = ['20','30','40','50',,'70',,,'100','200','300','400','500',,'700',,,'1k','2k','3k','4k','5k',,'7k',,,'10k',]
       this.vertLineArray = [];

       this.setCanvas();
    }


    setCanvas() {
        this.canvas = document.getElementById("fftAnalyser");
        this.canvasCtx = this.canvas.getContext("2d");
        
        if (this.canvas != undefined && this.canvasCtx != undefined) {
            this.ready = true;

            for (let i=0; i<this.canvas.width-this.horOffset; i++) {
                const value = this.freqArray[i]*Math.pow(10,1/((this.canvas.width-this.horOffset)/3))
                this.freqArray.push(value)
            }

            let baseLog = Math.log(this.vertNumArray[0])/Math.log(10);

            for (let i=0; i<this.vertNumArray.length; i++){
                
                let value = this.horOffset + Math.round((this.canvas.width-this.horOffset)/3 * (Math.log(this.vertNumArray[i]) / Math.log(10) - baseLog));
                this.vertLineArray.push(value);
            }
        }
        this.drawBackground();
    }

    drawBackground() {
        let canvas = document.getElementById("plotBackground");
        let canvasCtx = canvas.getContext("2d");
        canvasCtx.globalAlpha = 1.0;
        canvasCtx.fillStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.fillStyle = "rgb(127, 127, 127)";
        canvasCtx.lineWidth = 1;

        canvasCtx.strokeStyle = "rgb(255,255, 255)";
        canvasCtx.beginPath();
        canvasCtx.rect(this.horOffset,0,canvas.width-this.horOffset,canvas.height-this.vertOffset)
        canvasCtx.stroke();

        canvasCtx.font = "8px Arial";
        canvasCtx.strokeStyle = "rgb(63, 63, 63)";
        const horHeight = (canvas.height-this.vertOffset)/this.horLines;

        for (let i=1; i<this.horLines; i++) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(this.horOffset,i*horHeight);
            canvasCtx.lineTo(canvas.width,i*horHeight);
            let db = 20 - 10*i
            canvasCtx.fillText(db,3,(i)*horHeight )
            canvasCtx.lineWidth = 1;
            if (i == 2) canvasCtx.strokeStyle = "rgb(127, 63, 63)";
            else canvasCtx.strokeStyle = "rgb(63, 63, 63)";
            canvasCtx.stroke();
        }
        canvasCtx.fillText("-" + this.decibelRange,3,(this.horLines)*horHeight)
        canvasCtx.moveTo(0,0);

        canvasCtx.beginPath();
        canvasCtx.strokeStyle = "rgb(63, 63, 63)";
        for (let i=0; i<this.vertLineArray.length; i++) {
            if (i>0) {
                canvasCtx.moveTo(this.vertLineArray[i],0);
                canvasCtx.lineTo(this.vertLineArray[i],canvas.height-this.vertOffset);
            }
            if (this.vertNumTextArray[i] != undefined) {
                canvasCtx.fillText(this.vertNumTextArray[i],this.vertLineArray[i]-5,canvas.height-10);
            }
        }
        canvasCtx.stroke();
    }

    async draw() {
        
        var dataArray = new Float32Array(this.node.frequencyBinCount);
        this.node.getFloatFrequencyData(dataArray);

        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.canvasCtx.fillStyle = "rgb(26, 133, 199)";
        this.canvasCtx.strokeStyle =  "rgb(26, 133, 199)";
        this.canvasCtx.beginPath();
        this.canvasCtx.globalAlpha = 0.75;
        for (var i = 0; i < this.freqArray.length; i++) {
            let freq = this.getFrequencyValue(this.freqArray[i],dataArray)+14.4148
            let height = (this.decibelRange+freq) * (this.canvas.height*0.8)/this.decibelRange;
            if (height < 0) height = 0;
            let offset = this.canvas.height - height;

            let x = this.horOffset+i;
            let y = -this.vertOffset+offset;
            if ( i == 0 ) {
                this.canvasCtx.moveTo(x,y);
            } 
            else {
                this.canvasCtx.lineTo(x,y);
            }
        }

        this.canvasCtx.stroke();
    }

    getFrequencyValue(frequency,dataArray) {
        var nyquist = this.node.context.sampleRate/2;
        var index = Math.round(frequency/nyquist * this.node.frequencyBinCount);
        return dataArray[index];
    }

      
      
}