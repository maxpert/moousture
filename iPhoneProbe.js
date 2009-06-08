/*
* License:
* 	GPLv3  (http://www.gnu.org/licenses/gpl-3.0.txt)
* Copyright:
* 	MaXPert [Zohaib Sibt-e-Hassan] (http://www.gnu.org/licenses/gpl-3.0.txt)
* Testing:
* 		Oskar Krawczyk (oskar.krawczyk@gmail.com / http://nouincolor.com/)
*/

Moousture.iPhoneProbe = 
new Class(
{
	/*
		constructort mouse movement probe for given target DOM object .e.g. $(body), $('foo')
	*/
	
	allowed: false,
	
	Implements: [Options ],
	
	options: {
				//Action performed while n fingers are touched
				touched: 1
			},
	
    initialize: function(target, opts)
    {
        this.pos = {x:-1, y:-1};
		
		this.setOptions(opts);
		
		/*
		*	private touch event tracking callback function
		*/
		var _tmove = function(evt)
		{		
			e = new Event(evt);
			//Perform record only when required touches have been met
			if(evt.touches.length == this.options.touched){
				//Prevent default + stop propogation to upper elements
				e.stop();
				this.pos.x = evt.touches[0].pageX;
				this.pos.y = evt.touches[0].pageY;
			}
		};
		
		target.addEventListener("touchmove", _tmove.bind(this), false);
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