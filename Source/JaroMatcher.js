Moousture.JaroMatcher = new Class(
{
	Implements: [Moousture.GestureMatcher],
	
	options: {
		reduceConsistency: 2
	},
	
	onMatch: function(mov){
		mov = Moousture.Util.nPairReduce(mov, this.options.reduceConsistency);
		var cbLen = this.mCallbacks.length;
		
		if( cbLen < 1 )
			return ;
		
		var minIndex = 0;
		var minDist = 1 - this.jaroDistance(mov, this.mGestures[0]);
		
		
        for(var p=1; p<cbLen; p++)
		{
			
			var nwDist = 1 - this.jaroDistance(mov, this.mGestures[p]);
			if( nwDist < minDist ){
				minDist = nwDist;
				minIndex = p;
			}
		}
		
		this.mCallbacks[minIndex](minDist);
	},
	
	jaroDistance: function(str1, str2){
		var lastMax = ((str1.length > str2.length)?str1.length:str2.length);
		var allowedRange = lastMax>>1;
		
		//initialize array to false
		var found1 = new Array();
		var found2 = new Array();
		for(var i=0; i<str2.length; i++){
			if(i<str1.length)
				found1.push(false);
			found2.push(false);
		}
		
		var common = 0;
		
		for(var i=0; i<str1.length; i++){
			var first = i-allowedRange;
			var last = i+allowedRange;
			
			if(last>lastMax) last = lastMax;
			if(first<0) first = 0;
			
			for(var j=first; j<last; j++){
				if( !found2[j] && str1[i] == str2[j] ){
					common++;
					found1[i] = found2[j] = true;
					break;
				}
			}
		}
		
		if(common == 0)
			return 0;
		
		var nextFound = 0;
		var transpos = 0;
		
		for(var i=0;i<found1.length;i++){
			if(found1[i]){
				for(var j=nextFound;j<found2.length;j++){
					if(found2[j]){
						nextFound = j+1;
						if(str1[i] != str2[j]){
							transpos += 0.5;
						}else
							break;
					}
				}
			}
		}
		
		var ret = (common/str1.length + common/str2.length + (common-transpos)/common)/3;
		
		if(ret>1)
			ret = 1;
		
		//if(console && console.log)
		//	console.log(str1,str2,"Jaro", ret);
		
		return ret;
    }
}
);