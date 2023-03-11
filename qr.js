const axios = require('axios')
var fs = require('fs');
let LOG=console.log;

async function qrstatus(sid){
	let res=await axios.get(`https://api.nn.ci/proxy/https://open.aliyundrive.com/oauth/qrcode/${sid}/status`,{headers:{
		"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
		"sec-ch-ua-platform":"Windows",
		"Accept":"*/*",
		"Origin":"https://alist.nn.ci",
		//Sec-Fetch-Site: same-site
		//Sec-Fetch-Mode: cors
		//Sec-Fetch-Dest: empty
		"Referer":"https://alist.nn.ci/"
	}

	});
	return res.data;
}

async function getrtk(sid)
{
	//https://api.nn.ci/alist/ali_open/code
	let res=await axios.post(`https://api.nn.ci/alist/ali_open/code`,{code:sid, grant_type: "authorization_code"},
	{
		headers:{
			"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
			"sec-ch-ua-platform":"Windows",
			"Accept":"*/*",
			"Origin":"https://alist.nn.ci",
			//Sec-Fetch-Site: same-site
			//Sec-Fetch-Mode: cors
			//Sec-Fetch-Dest: empty
			"Referer":"https://alist.nn.ci/"
		}
	});
	return res.data;
}
function wait(ms){
    return new Promise((r,j)=>{setTimeout(()=>{r();}, ms)});
}
async function apiqr(){
	let res=await axios.post("https://api.nn.ci/alist/ali_open/qr",{});
	return res.data;
}

async function main()
{
	// let d=await apirefreshToken();
	
	// https://open.aliyundrive.com
	// console.log(d);
	// let dinfo=await getDriveInfo(d);
	// d.default_drive_id=dinfo.default_drive_id;
	// LOG(d);
	// let rx=await listall(d,"xxxxxxxxxxx");
	// listall(d,"root");
	// LOG(rx);
	while(true){
		let qr=await apiqr();
		LOG(qr);
		let reqstatus=true;
		while(reqstatus){
			let ret=await qrstatus(qr.sid);
			LOG(ret);
			switch(ret.status){
				case "QRCodeExpired":
					reqstatus=false;
					break;
				case "WaitLogin":
					await wait(3000);
					break;
				case "ScanSuccess":break;
				case "LoginSuccess":
					let rtkx=await getrtk(ret.authCode);
					LOG(rtkx);
				default:
					return;
					
			}
		}
	}
	
	
	
}
main();