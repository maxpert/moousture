/*
---
description: Mouse gesture library, that allows you to create custom mouse gesters and react on them

license: MIT-style

authors:
- Zohaib Sibt-e-Hassan

provides: [Moousture.Monitor, Moousture.MouseProbe, Moousture.Recorder, Moousture.Directions, Moousture.GestureMatcher, Moousture.LevenMatcher, Moousture.ReducedLevenMatcher]

...
*/

var Moousture = 
new Class(
{
}
);

Moousture.Directions = {
	East: 0,
	SouthEast: 1,
	South: 2,
	SouthWest: 3,
	West: 4,
	NorthWest: 5,
	North: 6,
	NorthEast: 7,
	E: 0,
	SE: 1,
	S: 2,
	SW: 3,
	W: 4,
	NW: 5,
	N: 6,
	NE: 7
};

Moousture.MouseProbe = 
new Class(
{
	Implements: [ Options ],
	
	options: {
				stopEvent: false
			},
	/*
		constructort mouse movement probe for given target DOM object .e.g. $(body), $('foo')
	*/
    initialize: function(target, options)
    {
        this.pos = {x:-1, y:-1};
		this.setOptions(options);
		
		/*
		*	private mouse event tracking callback function
		*/
		var _track = function(evt)
		{
			this.pos.x = evt.page.x;
			this.pos.y = evt.page.y;
			if (this.options.stopEvent){
				evt.stop();
			}else{
				evt.stopPropagation();
			}
		};
		
        // Compatibility patch
        $(target).addEvent('mousemove', _track.bind(this) );
    },
    
	
	/*
	*	return the probed positions
	*/
    probe: function ()
    {
        var pos = { };
		$extend(pos, this.pos);
        return pos;
    }
}
);

Moousture.Monitor = 
new Class(
{
	/*
	*	Constructor
	*	@delay: delay between probes in ms lower mean more sensitive
	*	@tHold: threshold of mouse displacement to be ignored while in stable state ( in pixels )
	*/
    initialize: function (delay, tHold)
    {
        this.prev = {x:0, y:0};
        this.delay = $pick( delay, 20 );
        this.thresh = $pick( tHold, 1 );
        this.wasStable = false;
    },
	
	/*
	*	Private preodic function to probe the mouse movement
	*/
    
    _monitor: function() {
        var pos = this.prober.probe();
        
        if ( Math.abs(pos.x - this.prev.x) < this.thresh && Math.abs( pos.y - this.prev.y ) < this.thresh )
        {
            if( !this.wasStable ){
                this.cbObject.onStable(pos);
			}
            this.wasStable = true;
        }
        else
        {
            if( this.wasStable ){
                this.cbObject.onUnstable(pos);
            }else{
                this.cbObject.onMove(pos);
			}
            this.wasStable = false;
        }
        
        this.prev = pos;
    },
    
    /*
        *	prober: an Object containing method probe returning an object with {x, y} for position parameters
        *	eventObj: an eventObject containing callback functions - onStable, - reset, - onMove and - onUnstable
        */
    start: function(prober, eventObj){
		if( this.timer ){ 
			this.stop(); 
		}
        this.prober = prober;
        this.cbObject = eventObj;
        this.timer = this._monitor.periodical( this.delay, this );
    },
    
	/*
	* Stop and delete timer probing
	*/
    stop: function(){
        $clear(this.timer);
		delete this.timer;
    }
}
);

/*
 * Manual monitor class that can be used to start monitoring manually and stopping
 * them manually. The main crux of whole class is match subroutine (calling start won't fire matched
 * callbacks; instead only probe recording will be carried out); ASAP match() is called the
 * system will match the guesture and fire appropriate callback
 */
Moousture.ManualMonitor = 
new Class(
{

	/*
	*	Constructor
	*	@delay: delay between probes in ms lower mean more sensitive
	*	@tHold: threshold of mouse displacement to be ignored while in stable state ( in pixels )
	*/
    initialize: function (delay)
    {
        this.delay = $pick( delay, 20 );
    },
	
	/*
	*	Private preodic function to probe the mouse movement
	*/
    
    _monitor: function() {
        var pos = this.prober.probe();
        this.cbObject.onMove(pos);
    },
	
	/*
	*	prober: an Object containing method probe returning an object with {x, y} for position parameters
	*	eventObj: an eventObject containing callback functions - onStable, - reset, - onMove and - onUnstable
	*/
    start: function(prober, eventObj){
		if( this.timer ){ this.stop(); }
        this.prober = prober;
        this.cbObject = eventObj;
        this.timer = this._monitor.periodical( this.delay, this );
		this.cbObject.reset();
    },
	
	/*
	*	call match will trigger matching algorithm from recorder via onUnstable
	*/
	match: function(){
		if(!this.cbObject){
			return;
		}
			
		this.cbObject.onStable(this.prober.probe());
	},
    
	/*
	* Stop and delete timer probing
	*/
    stop: function(){
        $clear(this.timer);
		delete this.timer;
    }
});

Moousture.Recorder = 
new Class(
{
	options: {
		matcher: null,
		maxSteps: 8,
		minSteps: 4
	},
	
	Implements: [Options, Events],
	/*
	* construct object
	* @obj: containing minSteps, maxSteps, matcher (more open for further compatibility).
	* initialize the callbacks table and gesture combinations table.
	*/
    initialize: function(obj){
		//Set options
		this.setOptions(obj);
		//Bug fix 
		this.options.matcher = obj.matcher;
        this.movLog = [];
    },
	
	/*
	* onStable is called once by the Monitor when mouse becomes stable .i.e. no changes in mouse position are occuring
	* @position: current mouse position
	*/
    onStable: function(position){
        if( this.movLog.length < this.options.minSteps ){
            this.movLog.empty();
            return;
        }
		
        if(this.options.matcher && this.options.matcher.match){
            this.options.matcher.match(this.movLog);
		}
		
		this.fireEvent('complete', [this.movLog]);
		
        this.movLog.empty();
    },
	
	/*
	* reset Move log
	*/
	reset: function(){
		this.movLog.empty();
	},
	
	/*
	* onUnstable is called by the Monitor first time when the mouse starts movement
	* @position: current mouse position
	*/
    
    onUnstable: function(position){
		this.movLog.empty();
        this.movLog.push(position);
		this.fireEvent('start');
    },
    
	/*
	* onMove is called by the Monitor when mouse was found moving last time as well
	* @position: current mouse position
	*/
	
    onMove: function(position){
        if(this.movLog.length > this.options.maxSteps){
            return;
		}
        this.movLog.push(position);
    }
}
);

/*
 * Base class for any guester macthing algorithm 
 * 
 */

Moousture.GestureMatcher = 
new Class(
{
	/*
	 * mCallbacks callback functions to invoke on corresponding indicies to mGuesters
	 * mGuesters containing guesture strings
	 */
	mCallbacks : [],
	mGestures : [],
	
	options: {},
	
	Implements: [Options],
	
	/*
	* construct object
	*/
    initialize: function(opts){
		this.setOptions(opts);
    },
	
	/*
        * Generates angle directions...
        * @input : track array
        * @output: directions array
        * 0 - Rightwards ( 3'O clock hour arm )
        * 1 - Bottom Rightwards
        * 2 - Bottomwards
        * 3 - Bottom Left
        * 4 - Left
        * 5 - Left Topwards
        * 6 - Upwards,
        * 7 - Right Upwards 
        */
    
    angelize: function(track){
        var ret = [];
        
        for(var i = 1; i< track.length - 1; i++ ) {
            ret.push( this.getAngles( track[i], track[i+1] ) );
		}
        return ret;
    },
    
    /*
        * Gets angle and length of mouse movement vector...
        * @input: two points
        * @output:  angle in radians
        */
    getAngles: function(oldP, newP){
        var diffx=newP.x-oldP.x;
        var diffy=newP.y-oldP.y;
        var a = Math.atan2(diffy,diffx) + Math.PI/8;
        
        if( a < 0 ){ a = a + (2 * Math.PI); }
        
        a = Math.floor( a /(2*Math.PI)*360 ) / 45;
        return Math.floor( a );
    },
	
	/*
	* Associate the given Gesture combination with callback
	*/
	addGesture: function(gesture, callback){
		this.mCallbacks.push(callback);
		this.mGestures.push(gesture);
	},
	
	/*
	* match is called after the mouse went through unstable -> moving -> stable stages
	* Key function
	* - vectorize track
	* @param track contains array of {x,y} objects
	*/
    match: function(track){
		var a = this.angelize(track);
		
		if( this.onMatch ){
			this.onMatch(a);
		}
    }
}
);


Moousture.Util = {};

/*
* nPairReduce utility functions that can be used by matchers to reduce the 
* movement direction vectors into unique quantized direction vectors containing x
* i.f.f. x is repeated n times continously e.g.
* [0, 0, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
* with n=1 is [0, 2, 1, 0, 1]
* with n=2 is [0, 2, 1, 0]
* @param arr array of moves list
* @param n length of constant repeatition
*/
Moousture.Util.nPairReduce = function(arr, n){
	var prev = null;
	var ret = [];
	
	n = $pick(n, 1);
	
	for(var i=0; i<arr.length-n+1; i++){
		var tmp = arr.slice(i, i+n);
		var ins = true;
		for(var j=1; j<tmp.length; j++){
			if(arr[i] != tmp[j]){
				ins = false;
			}
		}
		
		if(ins && prev!=arr[i]){
			ret.push(arr[i]);
			prev = arr[i];
		}
	}
	
	//if(console && console.log)
		//console.log(arr,n, ret);
	
	return ret;
};
