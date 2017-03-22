/*
	Licensed to the Apache Software Foundation (ASF) under one
	or more contributor license agreements.  See the NOTICE file
	distributed with this work for additional information
	regarding copyright ownership.  The ASF licenses this file
	to you under the Apache License, Version 2.0 (the
	"License"); you may not use this file except in compliance
	with the License.  You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing,
	software distributed under the License is distributed on an
	"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, either express or implied.  See the License for the
	specific language governing permissions and limitations
	under the License.
*/

/* AMCL FF_WWW number class */

/* General purpose Constructor */
var FF_WWW = function(n) {
	this.v=new Array(n);
	this.length=n;
	for (var i=0;i<n;i++)
		this.v[i]=new BIG_XXX(0);
};

FF_WWW.FFLEN=@ML@;
FF_WWW.P_MBITS=BIG_XXX.MODBYTES*8;
FF_WWW.P_OMASK=((-1)<<(FF_WWW.P_MBITS%BIG_XXX.BASEBITS));
FF_WWW.P_FEXCESS=(1<<(BIG_XXX.BASEBITS*BIG_XXX.NLEN-FF_WWW.P_MBITS));
FF_WWW.P_TBITS=(FF_WWW.P_MBITS%BIG_XXX.BASEBITS);
FF_WWW.FF_BITS=(BIG_XXX.BIGBITS*FF_WWW.FFLEN);
FF_WWW.HFLEN=(FF_WWW.FFLEN/2);  /* Useful for half-size RSA private key operations */

FF_WWW.prototype={
/* set to zero */

	P_EXCESS: function() 
	{
		return ((this.v[this.length-1].get(BIG_XXX.NLEN-1)&FF_WWW.P_OMASK)>>(FF_WWW.P_TBITS));
	},

	zero: function()
	{
		for (var i=0;i<this.length;i++) this.v[i].zero();
		return this;
	},

	getlen: function()
	{
		return this.length;
	},

/* set to integer */
	set: function(m)
	{
		this.zero();
		this.v[0].set(0,(m&BIG_XXX.BMASK));
		this.v[0].set(1,(m>>BIG_XXX.BASEBITS));
	},
/* copy from FF_WWW b */
	copy: function(b)
	{
		for (var i=0;i<this.length;i++)
		{
			this.v[i].copy(b.v[i]);
		}
	},
/* copy from FF_WWW b */
	rcopy: function(b)
	{
		for (var i=0;i<this.length;i++)
		{
			this.v[i].rcopy(b[i]);
		}
	},
/* x=y<<n */
	dsucopy: function(b)
	{
		for (var i=0;i<b.length;i++)
		{
			this.v[b.length+i].copy(b.v[i]);
			this.v[i].zero();
		}
	},
/* x=y */
	dscopy: function(b)
	{
		for (var i=0;i<b.length;i++)
		{
			this.v[i].copy(b.v[i]);
			this.v[b.length+i].zero();
		}
	},

/* x=y>>n */
	sducopy: function(b)
	{
		for (var i=0;i<this.length;i++)
		{
			this.v[i].copy(b.v[this.length+i]);
		}
	},
	one: function()
	{
		this.v[0].one();
		for (var i=1;i<this.length;i++)
		{
			this.v[i].zero();
		}
	},
/* test equals 0 */
	iszilch: function() 
	{
		for (var i=0;i<this.length;i++)
		{
			if (!this.v[i].iszilch()) return false;
		}
		return true;
	},
/* shift right by BIGBITS-bit words */
	shrw: function(n)
	{
		for (var i=0;i<n;i++) 
		{
			this.v[i].copy(this.v[i+n]);
			this.v[i+n].zero();
		}
	},

/* shift left by BIGBITS-bit words */
	shlw: function(n)
	{
		for (var i=0;i<n;i++) 
		{
			this.v[n+i].copy(this.v[i]);
			this.v[i].zero();
		}
	},
/* extract last bit */
	parity: function()
	{
		return this.v[0].parity();
	},

	lastbits: function(m)
	{
		return this.v[0].lastbits(m);
	},
	

/* recursive add */
	radd: function(vp,x,xp,y,yp,n)
	{
		for (var i=0;i<n;i++)
		{
			this.v[vp+i].copy(x.v[xp+i]);
			this.v[vp+i].add(y.v[yp+i]);
		}
	},

/* recursive inc */
	rinc: function(vp,y,yp,n)
	{
		for (var i=0;i<n;i++)
		{
			this.v[vp+i].add(y.v[yp+i]);
		}
	},

/* recursive sub */
	rsub: function(vp,x,xp,y,yp,n)
	{
		for (var i=0;i<n;i++)
		{
			this.v[vp+i].copy(x.v[xp+i]);
			this.v[vp+i].sub(y.v[yp+i]);
		}
	},

/* recursive dec */
	rdec: function(vp,y,yp,n)
	{
		for (var i=0;i<n;i++)
		{
			this.v[vp+i].sub(y.v[yp+i]);
		}
	},

/* simple add */
	add: function(b)
	{
		for (var i=0;i<this.length;i++)
			this.v[i].add(b.v[i]);
	},

/* simple sub */
	sub: function(b)
	{
		for (var i=0;i<this.length;i++)
			this.v[i].sub(b.v[i]);
	},
	
/* reverse sub */
	revsub: function(b)
	{
		for (var i=0;i<this.length;i++)
			this.v[i].rsub(b.v[i]);
	},

/* increment/decrement by a small integer */
	inc: function(m)
	{
		this.v[0].inc(m);
		this.norm();
	},

	dec: function(m)
	{
		this.v[0].dec(m);
		this.norm();
	},

	/* normalise - but hold any overflow in top part unless n<0 */
	rnorm: function(vp,n)
	{
		var trunc=false;
		var i,carry;
		if (n<0)
		{ /* -v n signals to do truncation */
			n=-n;
			trunc=true;
		}
		for (i=0;i<n-1;i++)
		{
			carry=this.v[vp+i].norm();  
			this.v[vp+i].xortop(carry<<FF_WWW.P_TBITS);
			this.v[vp+i+1].inc(carry);
		}
		carry=this.v[vp+n-1].norm();
		if (trunc) 
			this.v[vp+n-1].xortop(carry<<FF_WWW.P_TBITS);
		return this;
	},
	norm: function()
	{
		this.rnorm(0,this.length);
	},

/* shift left by one bit */
	shl: function()
	{
		var i,carry,delay_carry=0;
		for (i=0;i<this.length-1;i++)
		{
			carry=this.v[i].fshl(1);
			this.v[i].inc(delay_carry);
			this.v[i].xortop(carry<<FF_WWW.P_TBITS);
			delay_carry=carry;
		}
		this.v[this.length-1].fshl(1);
		this.v[this.length-1].inc(delay_carry);
	},

/* shift right by one bit */
	shr: function()
	{
		var i,carry;
		for (i=this.length-1;i>0;i--)
		{
			carry=this.v[i].fshr(1);
			this.v[i-1].ortop(carry<<FF_WWW.P_TBITS);
		}
		this.v[0].fshr(1);
	},

/* Convert to Hex String */
	toString: function() 
	{
		this.norm();
		var s="";

		for (var i=this.length-1;i>=0;i--)
		{
			s+=this.v[i].toString();
		}
		return s;
	},
/* Convert FF_WWWs to/from byte arrays */
	toBytes: function(b)
	{
		for (var i=0;i<this.length;i++)
		{
			this.v[i].tobytearray(b,(this.length-i-1)*BIG_XXX.MODBYTES);
		}
	},

/* z=x*y, t is workspace */
	karmul: function(vp,x,xp,y,yp,t,tp,n)
	{
		var nd2;
		if (n==1)
		{
			var d=BIG_XXX.mul(x.v[xp],y.v[yp]);
			this.v[vp+1]=d.split(8*BIG_XXX.MODBYTES);
			this.v[vp].copy(d);
			return;
		}
		nd2=n/2;
		this.radd(vp,x,xp,x,xp+nd2,nd2);
		this.rnorm(vp,nd2);                   /* Important - required for 32-bit build */
		this.radd(vp+nd2,y,yp,y,yp+nd2,nd2);
		this.rnorm(vp+nd2,nd2);               /* Important - required for 32-bit build */
		t.karmul(tp,this,vp,this,vp+nd2,t,tp+n,nd2);
		this.karmul(vp,x,xp,y,yp,t,tp+n,nd2);
		this.karmul(vp+n,x,xp+nd2,y,yp+nd2,t,tp+n,nd2);
		t.rdec(tp,this,vp,n);
		t.rdec(tp,this,vp+n,n);
		this.rinc(vp+nd2,t,tp,n);
		this.rnorm(vp,2*n);
	},

	karsqr: function(vp,x,xp,t,tp,n)
	{
		var nd2;
		if (n==1)
		{
			var d=BIG_XXX.sqr(x.v[xp]);
			this.v[vp+1].copy(d.split(8*BIG_XXX.MODBYTES));
			this.v[vp].copy(d);
			return;
		}	

		nd2=n/2;
		this.karsqr(vp,x,xp,t,tp+n,nd2);
		this.karsqr(vp+n,x,xp+nd2,t,tp+n,nd2);
		t.karmul(tp,x,xp,x,xp+nd2,t,tp+n,nd2);
		this.rinc(vp+nd2,t,tp,n);
		this.rinc(vp+nd2,t,tp,n);
		this.rnorm(vp+nd2,n);
	},

	karmul_lower: function(vp,x,xp,y,yp,t,tp,n)
	{ /* Calculates Least Significant bottom half of x*y */
		var nd2;
		if (n==1)
		{ /* only calculate bottom half of product */
			this.v[vp].copy(BIG_XXX.smul(x.v[xp],y.v[yp]));
			return;
		}
		nd2=n/2;

		this.karmul(vp,x,xp,y,yp,t,tp+n,nd2);
		t.karmul_lower(tp,x,xp+nd2,y,yp,t,tp+n,nd2);
		this.rinc(vp+nd2,t,tp,nd2);
		t.karmul_lower(tp,x,xp,y,yp+nd2,t,tp+n,nd2);

		this.rinc(vp+nd2,t,tp,nd2);
		this.rnorm(vp+nd2,-nd2);  /* truncate it */
	},

	karmul_upper: function(x,y,t,n)
	{ /* Calculates Most Significant upper half of x*y, given lower part */
		var nd2;
 
		nd2=n/2;
		this.radd(n,x,0,x,nd2,nd2);  
		this.radd(n+nd2,y,0,y,nd2,nd2);
		this.rnorm(n,nd2);
		this.rnorm(n+nd2,nd2);

		t.karmul(0,this,n+nd2,this,n,t,n,nd2);  /* t = (a0+a1)(b0+b1) */
		this.karmul(n,x,nd2,y,nd2,t,n,nd2); /* z[n]= a1*b1 */
									/* z[0-nd2]=l(a0b0) z[nd2-n]= h(a0b0)+l(t)-l(a0b0)-l(a1b1) */
		t.rdec(0,this,n,n);              /* t=t-a1b1  */							
		this.rinc(nd2,this,0,nd2);   /* z[nd2-n]+=l(a0b0) = h(a0b0)+l(t)-l(a1b1)  */
		this.rdec(nd2,t,0,nd2);   /* z[nd2-n]=h(a0b0)+l(t)-l(a1b1)-l(t-a1b1)=h(a0b0) */
		this.rnorm(0,-n);					/* a0b0 now in z - truncate it */
		t.rdec(0,this,0,n);         /* (a0+a1)(b0+b1) - a0b0 */
		this.rinc(nd2,t,0,n);

		this.rnorm(nd2,n);
	},

/* return low part of product this*y */
	lmul: function(y)
	{
		var n=this.length;
		var t=new FF_WWW(2*n);
		var x=new FF_WWW(n); x.copy(this);
		this.karmul_lower(0,x,0,y,0,t,0,n);
	},

/* Set b=b mod c */
	mod: function(c)
	{
		var k=0;  

		this.norm();
		if (FF_WWW.comp(this,c)<0) 
			return;
		do
		{
			c.shl();
			k++;
		} while (FF_WWW.comp(this,c)>=0);

		while (k>0)
		{
			c.shr();
			if (FF_WWW.comp(this,c)>=0)
			{
				this.sub(c);
				this.norm();
			}
			k--;
		}
	},

/* return This mod modulus, N is modulus, ND is Montgomery Constant */
	reduce: function(N,ND)
	{ /* fast karatsuba Montgomery reduction */
		var n=N.length;
		var t=new FF_WWW(2*n);
		var r=new FF_WWW(n);
		var m=new FF_WWW(n);

		r.sducopy(this);
		m.karmul_lower(0,this,0,ND,0,t,0,n);
		this.karmul_upper(N,m,t,n);
		m.sducopy(this);

		r.add(N);
		r.sub(m);
		r.norm();

		return r;

	},

/* Set r=this mod b */
/* this is of length - 2*n */
/* r,b is of length - n */
	dmod: function(b)
	{
		var k,n=b.length;
		var m=new FF_WWW(2*n);
		var x=new FF_WWW(2*n);
		var r=new FF_WWW(n);

		x.copy(this);
		x.norm();
		m.dsucopy(b); k=BIG_XXX.BIGBITS*n;

		while (k>0)
		{	
			m.shr();

			if (FF_WWW.comp(x,m)>=0)
			{
				x.sub(m);
				x.norm();
			}
			k--;
		}

		r.copy(x);
		r.mod(b);
		return r;
	},

/* Set return=1/this mod p. Binary method - a<p on entry */
	invmodp: function(p)
	{
		var n=p.length;

		var u=new FF_WWW(n);
		var v=new FF_WWW(n);
		var x1=new FF_WWW(n);
		var x2=new FF_WWW(n);
		var t=new FF_WWW(n);
		var one=new FF_WWW(n);

		one.one();
		u.copy(this);
		v.copy(p);
		x1.copy(one);
		x2.zero();

	// reduce n in here as well! 
		while (FF_WWW.comp(u,one)!==0 && FF_WWW.comp(v,one)!==0)
		{
			while (u.parity()===0)
			{
				u.shr();
				if (x1.parity()!==0)
				{
					x1.add(p); 
					x1.norm();
				}
				x1.shr(); 
			}
			while (v.parity()===0)
			{
				v.shr(); 
				if (x2.parity()!==0)
				{
					x2.add(p);
					x2.norm();
				}
				x2.shr();
			}
			if (FF_WWW.comp(u,v)>=0)
			{

				u.sub(v);
				u.norm();
				if (FF_WWW.comp(x1,x2)>=0) x1.sub(x2);
				else
				{
					t.copy(p);
					t.sub(x2);
					x1.add(t);
				}
				x1.norm();
			}
			else
			{
				v.sub(u);
				v.norm();
				if (FF_WWW.comp(x2,x1)>=0) x2.sub(x1);
				else
				{
					t.copy(p);
					t.sub(x1);
					x2.add(t);
				}
				x2.norm();
			}
		}
		if (FF_WWW.comp(u,one)===0)
			this.copy(x1);
		else
			this.copy(x2);
	},

/* nresidue mod m */
	nres: function(m)
	{
		var n=m.length;
		if (n==1)
		{
			var d=new DBIG_XXX(0);
			d.hcopy(this.v[0]);
			d.shl(BIG_XXX.NLEN*BIG_XXX.BASEBITS);
			this.v[0].copy(d.mod(m.v[0]));
		}
		else
		{
			var d=new FF_WWW(2*n);
			d.dsucopy(this);
			this.copy(d.dmod(m));
		}
	},

	redc: function(m,ND)
	{
		var n=m.length;
		if (n==1)
		{
			var d=new DBIG_XXX(0);
			d.hcopy(this.v[0]);
			this.v[0].copy(BIG_XXX.monty(m.v[0],(1<<BIG_XXX.BASEBITS)-ND.v[0].w[0],d));
		}
		else
		{
			var d=new FF_WWW(2*n);
			this.mod(m);
			d.dscopy(this);
			this.copy(d.reduce(m,ND));
			this.mod(m);
		}
	},

	mod2m: function(m)
	{
		for (var i=m;i<this.length;i++)
			this.v[i].zero();
	},

	/* U=1/a mod 2^m - Arazi & Qi */
	invmod2m: function()
	{
		var i,n=this.length;

		var b=new FF_WWW(n);
		var c=new FF_WWW(n);
		var U=new FF_WWW(n);

		var t;

		U.zero();
		U.v[0].copy(this.v[0]);
		U.v[0].invmod2m();

		for (i=1;i<n;i<<=1)
		{
			b.copy(this); b.mod2m(i);
			t=FF_WWW.mul(U,b); t.shrw(i); b.copy(t);
			c.copy(this); c.shrw(i); c.mod2m(i);
			c.lmul(U); c.mod2m(i);

			b.add(c); b.norm();
			b.lmul(U); b.mod2m(i);

			c.one(); c.shlw(i); b.revsub(c); b.norm();
			b.shlw(i);
			U.add(b);
		}
		U.norm();
		return U;
	},

	random: function(rng)
	{
		var n=this.length;
		for (var i=0;i<n;i++)
		{
			this.v[i].copy(BIG_XXX.random(rng));
		}
	/* make sure top bit is 1 */
		while (this.v[n-1].nbits()<BIG_XXX.MODBYTES*8) this.v[n-1].copy(BIG_XXX.random(rng));

	},

	/* generate random x */
	randomnum: function(p,rng)
	{
		var n=this.length;
		var d=new FF_WWW(2*n);

		for (var i=0;i<2*n;i++)
		{
			d.v[i].copy(BIG_XXX.random(rng));
		}
		this.copy(d.dmod(p));
	},

	/* this*=y mod p */
	modmul: function(y,p,nd)
	{
		var ex=this.P_EXCESS();
		var ey=y.P_EXCESS();
		if ((ex+1)>=Math.floor((FF_WWW.P_FEXCESS-1)/(ey+1))) this.mod(p);
		var n=p.length;
		if (n==1)
		{
			var d=BIG_XXX.mul(this.v[0],y.v[0]);
			this.v[0].copy(BIG_XXX.monty(p.v[0],(1<<BIG_XXX.BASEBITS)-nd.v[0].w[0],d));
		}
		else
		{
			var d=FF_WWW.mul(this,y);
			this.copy(d.reduce(p,nd));
		}
	},

	/* this*=y mod p */
	modsqr: function(p,nd)
	{
		var ex=this.P_EXCESS();
		if ((ex+1)>=Math.floor((FF_WWW.P_FEXCESS-1)/(ex+1))) this.mod(p); 
		var n=p.length
		if (n==1)
		{
			var d=BIG_XXX.sqr(this.v[0]);
			this.v[0].copy(BIG_XXX.monty(p.v[0],(1<<BIG_XXX.BASEBITS)-nd.v[0].w[0],d));
		}
		else
		{
			var d=FF_WWW.sqr(this);
			this.copy(d.reduce(p,nd));
		}
	},

	/* this=this^e mod p using side-channel resistant Montgomery Ladder, for large e */
	skpow: function(e,p)
	{
		var i,b,n=p.length;
		var R0=new FF_WWW(n);
		var R1=new FF_WWW(n);
		var ND=p.invmod2m();

		this.mod(p);
		R0.one();
		R1.copy(this);
		R0.nres(p);
		R1.nres(p);

		for (i=8*BIG_XXX.MODBYTES*n-1;i>=0;i--)
		{

			b=e.v[Math.floor(i/BIG_XXX.BIGBITS)].bit(i%BIG_XXX.BIGBITS);

			this.copy(R0);
			this.modmul(R1,p,ND);

			FF_WWW.cswap(R0,R1,b);
			R0.modsqr(p,ND);

			R1.copy(this);
			FF_WWW.cswap(R0,R1,b);

		}

		this.copy(R0);
		this.redc(p,ND);
	},

	/* this =this^e mod p using side-channel resistant Montgomery Ladder, for short e */
	skspow: function(e,p)
	{
		var i,b,n=p.length;
		var R0=new FF_WWW(n);
		var R1=new FF_WWW(n);
		var ND=p.invmod2m();

		this.mod(p);
		R0.one();
		R1.copy(this);
		R0.nres(p);
		R1.nres(p);

		for (i=8*BIG_XXX.MODBYTES-1;i>=0;i--)
		{
			b=e.bit(i);
			this.copy(R0);
			this.modmul(R1,p,ND);

			FF_WWW.cswap(R0,R1,b);
			R0.modsqr(p,ND);

			R1.copy(this);
			FF_WWW.cswap(R0,R1,b);
		}
		this.copy(R0);
		this.redc(p,ND);
	},

	/* raise to an integer power - right-to-left method */
	power: function(e,p)
	{
		var n=p.length;
		var f=true;
		var w=new FF_WWW(n);
		var ND=p.invmod2m();

		w.copy(this);
		w.nres(p);

		if (e==2)
		{
			this.copy(w);
			this.modsqr(p,ND);
		}
		else for (; ; )
		{
			if (e%2==1) 
			{
				if (f) this.copy(w);
				else 
				{
					this.modmul(w,p,ND);
				}
				f=false;

			}
			e>>=1;
			if (e===0) break;
			w.modsqr(p,ND);
		}

		this.redc(p,ND);
	},

	/* this=this^e mod p, faster but not side channel resistant */
	pow: function(e,p)
	{
		var i,b,n=p.length;
		var w=new FF_WWW(n);
		var ND=p.invmod2m();

		w.copy(this);
		this.one();
		this.nres(p);
		w.nres(p);
		for (i=8*BIG_XXX.MODBYTES*n-1;i>=0;i--)
		{
			this.modsqr(p,ND);
			b=e.v[Math.floor(i/BIG_XXX.BIGBITS)].bit(i%BIG_XXX.BIGBITS);
			if (b==1) this.modmul(w,p,ND);
		}
		this.redc(p,ND);
	},

	/* double exponentiation r=x^e.y^f mod p */
	pow2: function(e,y,f,p)
	{
		var i,eb,fb,n=p.length;
		var xn=new FF_WWW(n);
		var yn=new FF_WWW(n);
		var xy=new FF_WWW(n);
		var ND=p.invmod2m();

		xn.copy(this);
		yn.copy(y);
		xn.nres(p);
		yn.nres(p);
		xy.copy(xn); xy.modmul(yn,p,ND);
		this.one();
		this.nres(p);

		for (i=8*BIG_XXX.MODBYTES-1;i>=0;i--)
		{
			eb=e.bit(i);
			fb=f.bit(i);
			this.modsqr(p,ND);
			if (eb==1)
			{
				if (fb==1) this.modmul(xy,p,ND);
				else this.modmul(xn,p,ND);
			}
			else
			{
				if (fb==1) this.modmul(yn,p,ND);
			}
		}
		this.redc(p,ND);
	},

	/* quick and dirty check for common factor with n */
	cfactor: function(s)
	{
		var r,n=this.length;
		var g;

		var x=new FF_WWW(n);
		var y=new FF_WWW(n);
		y.set(s);

		x.copy(this);
		x.norm();

		do
		{
			x.sub(y);
			x.norm();
			while (!x.iszilch() && x.parity()===0) x.shr();
		}
		while (FF_WWW.comp(x,y)>0);

		g=x.v[0].get(0);
		r=FF_WWW.igcd(s,g);
		if (r>1) return true;
		return false;
	}


};

/* compare x and y - must be normalised, and of same length */
FF_WWW.comp=function(a,b)
{
	var i,j;
	for (i=a.length-1;i>=0;i--)
	{
		j=BIG_XXX.comp(a.v[i],b.v[i]);
		if (j!==0) return j;
	}
	return 0;
};

FF_WWW.fromBytes=function(x,b)
{
	for (var i=0;i<x.length;i++)
	{
		x.v[i]=BIG_XXX.frombytearray(b,(x.length-i-1)*BIG_XXX.MODBYTES);
	}
};

/* in-place swapping using xor - side channel resistant - lengths must be the same */
FF_WWW.cswap=function(a,b,d)
{
	for (var i=0;i<a.length;i++)
	{
	//	BIG_XXX.cswap(a.v[i],b.v[i],d);
		a.v[i].cswap(b.v[i],d);
	}
};

	/* z=x*y. Assumes x and y are of same length. */
FF_WWW.mul=function(x,y)
{
	var n=x.length;
	var z=new FF_WWW(2*n);
	var t=new FF_WWW(2*n);
	z.karmul(0,x,0,y,0,t,0,n);
	return z;
};

	/* z=x^2 */
FF_WWW.sqr=function(x)
{
	var n=x.length;
	var z=new FF_WWW(2*n);
	var t=new FF_WWW(2*n);
	z.karsqr(0,x,0,t,0,n);
	return z;
};

FF_WWW.igcd=function(x,y)
{ /* integer GCD, returns GCD of x and y */
	var r;
	if (y===0) return x;
	while ((r=x%y)!==0)
		{x=y;y=r;}
	return y;
};

/* Miller-Rabin test for primality. Slow. */
FF_WWW.prime=function(p,rng)
{
	var i,j,s=0,n=p.length;
	var loop;
	var d=new FF_WWW(n);
	var x=new FF_WWW(n);
	var unity=new FF_WWW(n);
	var nm1=new FF_WWW(n);

	var sf=4849845; /* 3*5*.. *19 */
	p.norm();

	if (p.cfactor(sf)) return false;
	unity.one();
	nm1.copy(p);
	nm1.sub(unity);
	nm1.norm();
	d.copy(nm1);

	while (d.parity()===0)
	{
		d.shr();
		s++;
	}
	if (s===0) return false;

	for (i=0;i<10;i++)
	{
		x.randomnum(p,rng);
		x.pow(d,p);
		if (FF_WWW.comp(x,unity)===0 || FF_WWW.comp(x,nm1)===0) continue;
		loop=false;
		for (j=1;j<s;j++)
		{
			x.power(2,p);
			if (FF_WWW.comp(x,unity)===0) return false;
			if (FF_WWW.comp(x,nm1)===0) {loop=true; break;}
		}
		if (loop) continue;
		return false;
	}
	return true;
};
