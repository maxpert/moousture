Moousture.LevenMatcher = 
new Class(
{
	Implements: [Moousture.GestureMatcher],
	
	onMatch: function(mov){
		var cbLen = this.mCallbacks.length;
		
		if( cbLen < 1 ){
			return ;
		}
		
		var minIndex = 0;
		var minDist = this.levenDistance(mov, this.mGestures[0]);
		
		
        for(var p=1; p<cbLen; p++)
		{
			
			var nwDist = this.levenDistance(mov, this.mGestures[p]);
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
        var d = [],i,j,cost;
        
        for(i=0; i < v1.length; i++){
			d[i] = [];
		}
				
		if (v1[0] != v2[0]){
			d[0][0] = 1;
		}else{
			d[0][0] = 0;
		}

        for(i=1; i < v1.length; i++){
            d[i][0] = d[i-1][0] + 1;
		}
		
        for(j=1; j < v2.length; j++){
			d[0][j] = d[0][j-1] + 1;
		}
            
        for(i=1; i < v1.length; i++)
		{
            for(j=1; j < v2.length; j++)
            {
                cost = 0;
                if (v1[i] != v2[j]){
                    cost = 1;
				}
                
                d[i][j] = d[i-1][j] + 1;
                if ( d[i][j] > d[i][j-1]+1 ){ d[i][j] = d[i][j-1] + 1;}
                if ( d[i][j] > d[i-1][j-1]+cost ){ d[i][j] = d[i-1][j-1] + cost;}
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
	
	options: {
		reduceConsistency: 2
	},
	
	reduce: function(seq){
		return Moousture.Util.nPairReduce(seq, this.options.reduceConsistency);
	},
	
	onMatch: function (mov){
		mov = this.reduce(mov);
		
		var cbLen = this.mCallbacks.length;
		
		//fix applied for [ undefined ] moves
		if( cbLen < 1 || !$defined(mov[0])){
			return ;
		}
		
		var minIndex = 0;
		var minDist = this.levenDistance(mov, this.mGestures[0]);
		
        for(var p=1; p<cbLen; p++)
		{
			
			var nwDist = this.levenDistance(mov, this.mGestures[p]);
			
			if( nwDist < minDist ){
				minDist = nwDist;
				minIndex = p;
			}
		}
				
		this.mCallbacks[minIndex](minDist/mov.length);
	}
}
);
