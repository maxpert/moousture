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
			if (this.options.stopEvent)
				evt.stop();
			else
				evt.stopPropagation();
		}
		
        // Compatibility patch
        $(target).addEvent('mousemove', _track.bind(this) );
    },
    
	
	/*
	*	return the probed positions
	*/
    probe: function ()
    {
        pos = { };
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
        pos = this.prober.probe();
        
        if ( Math.abs(pos.x - this.prev.x) < this.thresh && Math.abs( pos.y - this.prev.y ) < this.thresh )
        {
            if( !this.wasStable )
                this.cbObject.onStable(pos);
            this.wasStable = true;
        }
        else
        {
            if( this.wasStable )
                this.cbObject.onUnstable(pos);
            else
                this.cbObject.onMove(pos);
            this.wasStable = false;
        }
        
        this.prev = pos;
    },
    
    /*
        *	prober: an Object containing method probe returning an object with {x, y} for position parameters
        *	eventObj: an eventObject containing callback functions - onStable, - onMove and - onUnstable
        */
    start: function(prober, eventObj){
		if( this.timer )
			this.stop();
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
		
        if(this.options.matcher && this.options.matcher.match)
            this.options.matcher.match(this.movLog);
		
		this.fireEvent('complete', [this.movLog]);
		
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
        if(this.movLog.length > this.options.maxSteps)
            return;
        this.movLog.push(position);
    }
}
);

Moousture.GestureMatcher = 
new Class(
{
	mCallbacks : [],
	mGestures : [],
	/*
	* construct object
	*/
    initialize: function(){
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
        ret = [];
        
        for( i = 1; i< track.length - 1; i++ )
            ret.push( this.getAngles( track[i], track[i+1] ) );
        return ret;
    },
    
    /*
        * Gets angle and length of mouse movement vector...
        * @input: two points
        * @output:  angle in radians
        */
    getAngles: function(oldP, newP){
        diffx=newP.x-oldP.x;
        diffy=newP.y-oldP.y;
        a = Math.atan2(diffy,diffx) + Math.PI/8;
        
        if( a < 0 ) a = a + (2 * Math.PI);
        
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
	* @track contains array of {x,y} objects
	* Key function
	* - vectorize track
	*/
    match: function(track){
		a = this.angelize(track);
		
		if( this.onMatch )
			this.onMatch(a);
    }
}
);

Moousture.LevenMatcher = 
new Class(
{
	Implements: [Moousture.GestureMatcher],
	
	onMatch: function(mov){
		cbLen = this.mCallbacks.length;
		
		if( cbLen < 1 )
			return ;
		
		minIndex = 0;
		minDist = this.levenDistance(mov, this.mGestures[0]);
		
        for(p=1; p<cbLen; p++)
		{
			
			nwDist = this.levenDistance(mov, this.mGestures[p]);
			if( nwDist < minDist ){
				minDist = nwDist;
				minIndex = p;
			}
		}
		
		this.mCallbacks[minIndex](minDist/mov.length);
	},
	
	/*
	* Fixes applied for:
	* > 1x1 matrix
	* > previously it returned original distance+1 as distance 
	* > [0][0] onwards moves were judged as well
	* > [undefined] targets handled
	*/
	levenDistance: function(v1, v2){
        d = [];
        
        for( i=0; i < v1.length; i++)
				d[i] = [];
				
		if (v1[0] != v2[0])
			d[0][0] = 1;
		else
			d[0][0] = 0;

        for( i=1; i < v1.length; i++)
            d[i][0] = d[i-1][0] + 1;
		
        for( j=1; j < v2.length; j++)
			d[0][j] = d[0][j-1] + 1;
            
        for( i=1; i < v1.length; i++)
		{
            for( j=1; j < v2.length; j++)
            {
                cost = 0;
                if (v1[i] != v2[j])
                    cost = 1;
                
                d[i][j] = d[i-1][j] + 1;
                if ( d[i][j] > d[i][j-1]+1 ) d[i][j] = d[i][j-1] + 1;
                if ( d[i][j] > d[i-1][j-1]+cost ) d[i][j] = d[i-1][j-1] + cost;
            }
		}

        return $pick(d[v1.length-1][v2.length-1], 0);
    }
}
);


Moousture.ReducedLevenMatcher = 
new Class(
{
	Implements: [Moousture.LevenMatcher],
	
	reduce: function(seq){
		ret = [];
		
		ret.push(seq[0])
		prev = seq[0];
		
		for(i=1;i<seq.length;i++)
			if(prev != seq[i])
			{
				ret.push(seq[i]);
				prev = seq[i];
			}
		
		return ret;
	},
	
	onMatch: function (mov){
		mov = this.reduce(mov);
		
		cbLen = this.mCallbacks.length;
		
		//fix applied for [ undefined ] moves
		if( cbLen < 1 || !$defined(mov[0]))
			return ;
		
		minIndex = 0;
		minDist = this.levenDistance(mov, this.mGestures[0]);
		
        for(p=1; p<cbLen; p++)
		{
			
			nwDist = this.levenDistance(mov, this.mGestures[p]);
			
			if( nwDist < minDist ){
				minDist = nwDist;
				minIndex = p;
			}
		}
				
		this.mCallbacks[minIndex](minDist/mov.length);
	}
}
);