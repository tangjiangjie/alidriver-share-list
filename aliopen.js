const axios = require('axios')

var fs = require('fs');
function wkexec(cmd){
	let process = require('child_process');
	process.exec(cmd, function(error, stdout, stderr) {
		console.log("error:"+error);
		console.log("stdout:"+stdout);
		console.log("stderr:"+stderr);
	});
}
function writefsync(name,str){
	fs.writeFileSync(name,str,(err)=>{if(err) console.log(err)});
}


var args = process.argv.splice(2)

function LOG(msg){
	console.log(msg);
}

async function apirefreshToken()
{

	let d={
		ClientID:"",
		ClientSecret:"",
		RefreshToken:"这里放aliopen的RefreshToken",
	};
	let res=await axios.post("https://api.nn.ci/alist/ali_open/token",{
			"client_id":     d.ClientID,
			"client_secret": d.ClientSecret,
			"grant_type":    "refresh_token",
			"refresh_token": d.RefreshToken,
		});
		
	
	return res.data;
	
}
async function apireq(d,uri,msg)
{
	return await axios.post("https://open.aliyundrive.com"+uri,msg,{
		headers:{Authorization:"Bearer "+d.access_token,"Content-Type":"application/json",}
	});
	
}
async function getDriveInfo(d)
{
	let res=await apireq(d,"/adrive/v1.0/user/getDriveInfo",{});
	return res.data;
	
}
async function wklink(d,fileid){
	let res=await apireq(d,"/adrive/v1.0/openFile/getDownloadUrl",
			{"drive_id":d.default_drive_id,
			"file_id":fileid,
			"expire_sec": 14400});
	return res.data;
}
async function rm(d,fileid){
	let res=await apireq(d,"/adrive/v1.0/openFile/recyclebin/trash",
			{"drive_id":d.default_drive_id,
			"file_id":fileid});
	return res.data;
}

async function listdir(d,fileid,marker){
	let res=await apireq(d,"/adrive/v1.0/openFile/list",
			{"drive_id":d.default_drive_id,
			"limit":200,"marker":marker,
			"order_by":"name",//"name,size,updated_at,created_at"
			"order_direction":"DESC",//"ASC,DESC"
			"parent_file_id":fileid});
	return res.data;
}

async function listall(d,fileid)
{
	let marker="";
	do{
		let objs=await listdir(d,fileid,marker);
		marker=objs.next_marker;
		LOG(objs);
		//items
	}while(marker!="");
	
}

function wait(ms){
    return new Promise((r,j)=>{setTimeout(()=>{r();}, ms)});
}

async function main()
{
	 let d=await apirefreshToken();
	
	// https://open.aliyundrive.com
	 console.log(d);
	 let dinfo=await getDriveInfo(d);
	 d.default_drive_id=dinfo.default_drive_id;
	// LOG(d);
	 let rx=await listall(d,"你自己的目录id");
	 listall(d,"root");
	 LOG(rx);
	
	
	
	
}

main()