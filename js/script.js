
const square=document.getElementById("square");
const frontside=document.getElementById("frontside");
const leftside=document.getElementById("leftside");
const rightside =document.getElementById("rightside");

frontside.addEventListener("click",()=>{
    frontside.style.display ="none";
    rightside.style.display="black";
    leftside.style.display="black";
    leftside.style.transform="rotate3d(0,0,0,90deg}";
    document.title="Login page";
});

rightside.addEventListener("click",()=>{
    frontside.style.display ="block";
    rightside.style.display="none";
    leftside.style.display="block";
    leftside.style.transform="rotate3d(0,0,0,90deg}";
    document.title="Sign up page";
});

leftside.addEventListener("click",()=>{
    frontside.style.display ="block";
    rightside.style.display="block";
    leftside.style.display="none";
    leftside.style.transform="rotate3d(0,1,0,90deg}";
    document.title="Forgot password page";
});