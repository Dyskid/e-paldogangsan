JSON_RESETTINGS = {
      'contentType' : 'application/json'
    , 'type'        : 'POST'
};

/**
 * 메뉴 가져오기(GET)
 * @param menuUrl (메뉴URL)
 * @param con_idx (탭IDX)
 * @param data (pamameter)
 */
var gfn_getMenuContent = function (menuUrl, data, reSettings) {
    var settings = {
          url      : menuUrl
        , dataType : 'html' /* html, json */
        , data     : data
        , success  : function(data){
            $('#contents').html(data);
            $('html').scrollTop(0);
        }
    };
    
    // 재정의된 settings 값이 있을 경우에 세팅
    if (reSettings) {
        var keys = Object.keys(reSettings), key, val;
        for (var index in keys) {
            key = keys[index];
            val = reSettings[key];
            
            settings[key] = val;
        }
    }
    
    $.ajax(settings);
}

/**
 * 메뉴 가져오기 (POST)
 * @param menuUrl (메뉴URL)
 * @param con_idx (탭IDX)
 * @param data (pamameter)
 */
var gfn_getMenuContent2 = function (menuUrl, data, reSettings) {
    var settings = {
    	type : 'POST'
        ,url      : menuUrl
        , dataType : 'html' /* html, json */
        , data     : data
        , success  : function(data){
            $('#contents').html(data);
            $('html').scrollTop(0);
        }
    };
    
    // 재정의된 settings 값이 있을 경우에 세팅
    if (reSettings) {
        var keys = Object.keys(reSettings), key, val;
        for (var index in keys) {
            key = keys[index];
            val = reSettings[key];
            
            settings[key] = val;
        }
    }
    
    $.ajax(settings);
}


/**
 * 탭 메뉴 생성
 * @param title (탭제목)
 * @param url (메뉴URL)
 * @param tid (탭ID)
 * @param data (pamameter)
 * @return tid (탭ID)
 **/
var gfn_addTabMenu = function (title, url, tid, data) {
    var main_nav_idx = 1;
    $("[id^='main_nav_']").each(function (index) {
        $("." + $(this).attr("id") + " li").each(function (idx) {
            if($(this).hasClass('on')){
                main_nav_idx = (index + 1);
            }
        });
    });

    // 탭생성
    if(tid == "" || tid == undefined){
        var check_idx = main_nav_idx;
        var idx = $("[id^='contents_']").last().attr("id").substring(9, $("[id^='contents_']").last().attr("id").length);
        var con_idx = Number(idx) + 1;
        var tabstring = '<li class="on" id=u' + check_idx + '_tab_' + con_idx + '><div><a href="#n" class="tab_name">' + title +'</a> <a href="#n" class="cls"></a></div></li>';
        var contentsadd = '<div id="contents_' + con_idx + '" class="contents" ></div>';
        $('.layer_tab_lim ul li').removeClass('on');

        $('.layer_tab_lim ul').append(tabstring);
        $('.contents').hide();
        $('.contents_tab').append(contentsadd);
        var b_w = $('body').width(),
        b_w = b_w -298,
        l_t_w = $('.layer_tab_lim ul').width();
        if(l_t_w >= b_w){
            $('.layer_tab_lim ul').css({left:'auto',right:'0px'});
        }
        layer_tab_ul();
        resize();

        tid = 'u' + check_idx + '_tab_' + con_idx;

        // contents post
        if(url != undefined && url != ""){
            gfn_getMenuContent(url, con_idx, data);
        }
        // contents post

    }else{
        var tab_idx = $('#' + tid).index();
        if(!$('#' + tid).is('.layer_tab_lim ul li:first-child a')){
            var tab_id = tid,
                tab_id = tab_id.split('_'),
                tab_ids = tab_id[1] + '_' + tab_id[2],
                ul_id = tab_id[0].substr(1,1);
            console.log(tab_id);
            $('.lnb a').not('a.lnb_slide').removeClass('on');
            $('.contents_tab .contents').eq(tab_idx).show().siblings().hide();
            $('#' + tid).addClass('on').siblings().removeClass('on');
            $('.lnb ul').eq(ul_id - 1).addClass('on').siblings().not('a.lnb_slide').removeClass('on');
            $('.main_nav ul').eq(ul_id - 1).children(':first-child').children().click();
            $('#l'+ ul_id +'_'+tab_ids).addClass('on').closest('li').addClass('on').siblings().removeClass('on');
        }else{
            console.log(tab_id);
            $('.lnb a').not('a.lnb_slide').removeClass('on');
            $('.contents_tab .contents').eq(tab_idx).show().siblings().hide();
            $('#' + tid).parent().parent().addClass('on').siblings().removeClass('on');
        }
        resize();
    }

    return tid;
}


/**
 * 활성화된 콘텐츠 아이디 가져오기
 * @return contents id (콘텐츠ID)
 **/
var gfn_getContentsId = function () {
    var contentsId;
    $("[id^='contents_']").each(function (index) {
        if($(this).css("display") == 'block'){
            contentsId = $(this).attr("id");
        }
    });
    return contentsId;
}


/**
 * 레이어팝업 가져오기
 * @param popupTitle (팝업제목)
 * @param popupUrl (팝업URL)
 * @param popupId (팝업ID)
 * @param data (pamameter)
 * @param callBack (call back method)
 */
var gfn_getLayerPopup = function (popupTitle, popupUrl, popupId, data, callBack) {
    data.popupTitle = popupTitle;
    data.popupId    = popupId;
    data.callBack   = callBack;
    $.ajax({
        url : popupUrl
        , dataType : "html" /* html, json */
        , data : data
        , success : function(data){
            $('.lnb').css('z-index','2');
            $('.layer_tab').css('z-index','1');
            $('#' + popupId).html(data);
            $('#' + popupId).show();
        }
    });
}


/**
 * 레이어팝업 가져오기
 * @param popupTitle (팝업제목)
 * @param popupUrl (팝업URL)
 * @param popupId (팝업ID)
 * @param data (pamameter)
 * @param callBack (call back method)
 */
var gfn_datepicker = function (datepickerId) {
    $('#' + datepickerId).datepicker({
        dateFormat: 'yy-mm-dd' //Input Display Format 변경
        , showOtherMonths: true //빈 공간에 현재월의 앞뒤월의 날짜를 표시
        , showMonthAfterYear:true //년도 먼저 나오고, 뒤에 월 표시
        , changeYear: true //콤보박스에서 년 선택 가능
        , changeMonth: true //콤보박스에서 월 선택 가능
        , showOn: "both" //button:버튼을 표시하고,버튼을 눌러야만 달력 표시 ^ both:버튼을 표시하고,버튼을 누르거나 input을 클릭하면 달력 표시
        , buttonImage: "/admin/images/btn_WF_Calendar.png" //버튼 이미지 경로
        , buttonImageOnly: true //기본 버튼의 회색 부분을 없애고, 이미지만 보이게 함
        , buttonText: "선택" //버튼에 마우스 갖다 댔을 때 표시되는 텍스트
        //, yearSuffix: "년" //달력의 년도 부분 뒤에 붙는 텍스트
        , monthNamesShort: ['1','2','3','4','5','6','7','8','9','10','11','12'] //달력의 월 부분 텍스트
        , monthNames: ['1','2','3','4','5','6','7','8','9','10','11','12'] //달력의 월 부분 Tooltip 텍스트
        , dayNamesMin: ['일','월','화','수','목','금','토'] //달력의 요일 부분 텍스트
        , dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'] //달력의 요일 부분 Tooltip 텍스트
        //, minDate: "-1M" //최소 선택일자(-1D:하루전, -1M:한달전, -1Y:일년전)
        //, maxDate: "+1M" //최대 선택일자(+1D:하루후, -1M:한달후, -1Y:일년후)
    });
}


/**
 * 로딩바 호출
 */
function gfn_showLoadingBar() {
    var loadingImg = '';
    loadingImg += "<div id='loadingImg' style='position:absolute; left:50%; top:40%; display:none; z-index:10000;transform: translate3d(-50%, -50%, 0);'>";
    loadingImg += " <img src='//img.ezwelfare.net/welfare_market/onnuri/css/ajax-loader.gif'/>";
    loadingImg += "</div>"; $('body').append(loadingImg);
    $('#loadingImg').show();
}

/*
function gfn_showLoadingBar() {
    var maskHeight = $(document).height();
    var maskWidth = window.document.body.clientWidth;
    var mask = "<div id='mask' style='position:absolute; z-index:9000; background-color:#000000; display:none; left:0; top:0;'></div>";
    var loadingImg = '';
    loadingImg += "<div id='loadingImg' style='position:absolute; left:50%; top:40%; display:none; z-index:10000;'>";
    loadingImg += ' <img src="' + contextPath.path + '/onnuri/css/ajax-loader.gif"/>';
    loadingImg += "</div>"; $('body').append(mask).append(loadingImg);
    $('#mask').css({'width' : maskWidth, 'height': maskHeight, 'opacity' : '0.3'});
    $('#mask').show();
    $('#loadingImg').show();
}
*/


/**
 * 로딩바 삭제
 */
function gfn_hideLoadingBar() {
    $('#loadingImg').hide();
    $('#loadingImg').remove();
}


/**
 * Ajax Setup 정의
 */
$.ajaxSetup({
	beforeSend: function(xhr){
		xhr.setRequestHeader("AJAX", true);
	}
});


/**
 * Ajax Error 정의
 */
$(document).ajaxError(function(event, xhr){
	if(xhr.status == 901){
        alert('중복로그인으로 인하여 로그아웃 되었습니다.');
        location.href    = "/onnuri/logout?duplicateYn=N";
    } else if(xhr.status == 401){
        alert('인증에 실패했습니다. 로그인 후 사용가능합니다.');
        location.href = "/onnuri/login/loginForm";
    } else if(xhr.status == 403){
        alert('세션이 만료되었습니다. 로그인 후 사용가능합니다.');
        location.href = "/onnuri/login/loginForm";
    } else {
		var result = JSON.parse(xhr.responseText);
    	alert(result.message);
    }
});


/**
 * Ajax 시작시 로딩바 호출
 */
$(document).ajaxStart(function () {
    gfn_showLoadingBar();
 });


/**
 * Ajax 종료시 로딩바 숨기기
 */
$(document).ajaxStop(function () {
    gfn_hideLoadingBar();
 });


/**
 * 천단위 콤마 넣기
 * @param str (숫자)
 * @returns {String}
 */
var gfn_setPriceInput = function(str) {
  str = str + '';
  str = str.replace(/,/g, '');
  var strArr = str.split('.');
  var retValue = "";
  for (var i = 1; i <= strArr[0].length; i++) {
      if (i > 1 && (i % 3) == 1) {
          retValue = strArr[0].charAt(strArr[0].length - i) + "," + retValue;
      } else {
          retValue = strArr[0].charAt(strArr[0].length - i) + retValue;
      }
  }
  if (strArr.length == 2) {
      retValue = retValue + '.' + strArr[1];
  }
  return retValue;
};


/**
 * 문자 체크
 * @param _val
 * @param _type (1 : 숫자,영문,특수문자, 2: 숫자만, 2: 영문만)
 * @returns {Boolean}
 */
var gfn_chkChar = function(_val, _type) {
    var regexp = '';
    if (_type == 1) {
        regexp = /[0-9a-zA-Z.;\-_]/; // 숫자,영문,특수문자
    } else if (_type == 2) {
        regexp = /[0-9]/; // 숫자만
    } else if (_type == 3) {
        regexp = /[a-zA-Z]/; // 영문만
    }
    if (regexp == '') {
        console.log('gfn_chkChar(_val, _type) 의 형식으로 호출하여 사용하세요.');
        return false;
    } else {
        for ( var loop = 0; loop < _val.length; loop++) {
            if (_val.charAt(loop) != " "
                    && regexp.test(_val.charAt(loop)) == false) {
                alert(_val.charAt(loop) + "는 입력불가능한 문자입니다");
                return false;
                break;
            }
        }
        return true;
    }
};


/**
 * 문자 체크 - 한글 자음/모음만 입력되었을 경우 체크
 * @param _val
 * @returns {Boolean}
 */
var gfn_chkCharKr = function(_val) {

    for ( var loop = 0; loop < _val.length; loop++) {
        var lastWord = _val.charAt(loop).replace(/%/gi, "\\");

        if ('\u3130' < lastWord && lastWord < '\u3164') { // 마지막 값이 자음이나 모음일
                                                            // 경우 return
            return false;
        }
    }
    return true;
};


/**
 * 생년월일 유효성 체크
 * @param str
 * @returns {Boolean}
 */
var gfn_isValidDate = function(str) {
    var dateStr = '';
    var regexp = /[0-9]/; // 숫자만
    for ( var loop = 0; loop < str.length; loop++) {
        if (regexp.test(str.charAt(loop))) {
            dateStr += str.charAt(loop);
        }
    }
    if (dateStr.length < 8) {
        alert("생년월일을 숫자 8자리로 입력하여 주세요");
        return false;
    } else {
        var today = new Date(); // 날자 변수 선언
        var t_year = today.getFullYear() + '';
        var t_month = today.getMonth();
        t_month = t_month < 10 ? '0' + t_month : t_month;
        var t_date = today.getDate();
        t_date = t_date < 10 ? '0' + t_date : t_date;
        var nowDate = t_year + t_month + t_date;
        if (gfn_calcInterval(dateStr, '0000', nowDate, '0000').split(',')[0] < 0) {
            alert("생년월일을 정확하게 입력하여 주세요.");
            return false;
        } else {
            var year = dateStr.substr(0, 4) - 0;
            var month = dateStr.substr(4, 2) - 0;
            var day = dateStr.substr(6, 2) - 0;
            if (month < 1 || month > 12) {
                alert("달은 1월부터 12월까지 입력 가능합니다.");
                return false;
            }
            if (day < 1 || day > 31) {
                alert("일은 1일부터 31일까지 입력가능합니다.");
                return false;
            }
            if ((month == 4 || month == 6 || month == 9 || month == 11)
                    && day == 31) {
                alert(month + "월은 31일이 존재하지 않습니다.");
                return false;
            }
            if (month == 2) {
                var isleap = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
                if (day > 29 || (day == 29 && !isleap)) {
                    alert(year + "년 2월은  " + day + "일이 없습니다.");
                    return false;
                }
            }
            return true;
        }
    }
};


/**
 * 시간 차이 계산
 * @param pDt (yyyymmdd)
 * @param pTm (hh24mi)
 * @param nDt (yyyymmdd)
 * @param nTm (hh24mi)
 * @returns {String}
 */
var gfn_calcInterval = function(pDt, pTm, nDt, nTm) {
    /* 날짜형식 가공 - yyyymmdd, hh24mi */
    pDt = pDt + '';
    nDt = nDt + '';
    if (pDt.length != 8) {
        if (pDt.length == 10) {
            pDt = pDt.substring(0, 4) + pDt.substring(5, 7)
                    + pDt.substring(8, 10);
        } else if (pDt.length == 6) {

            pDt = '20' + pDt; // 날짜 비교를 하는것이기 때문에 크게 신경안씀..
        } else if (pDt.lenght != 0) {
            // alert('날짜 형식을 yyyymmdd 로 입력해주세요.');
            return '0';
        }
    }
    if (nDt.length != 8) {
        if (nDt.length == 10) {
            nDt = nDt.substring(0, 4) + nDt.substring(5, 7)
                    + nDt.substring(8, 10);
        } else if (nDt.length == 6) {

            nDt = '20' + nDt; // 날짜 비교를 하는것이기 때문에 크게 신경안씀..
        } else if (nDt.lenght != 0) {
            // alert('날짜 형식을 yyyymmdd 로 입력해주세요.');
            return '0';
        }
    }
    /** 시간형식 가공 */
    pTm = pTm + '';
    nTm = nTm + '';
    if (pTm.length != 4) {
        if (pTm.length == 5) {
            pTm = pTm.substring(0, 2) + pTm.substring(3, 5);
        } else if (pTm.length > 5) {
            pTm = pTm.substring(0, 2) + pTm.substring(3, 5);
        } else {
            // alert('시간 형식을 0000 으로 입력해주세요.');
            return '0';
        }
    }
    if (nTm.length != 4) {
        if (nTm.length == 5) {
            nTm = nTm.substring(0, 2) + nTm.substring(3, 5);
        } else if (nTm.length > 5) {
            nTm = nTm.substring(0, 2) + nTm.substring(3, 5);
        } else {
            // alert('시간 형식을 0000 으로 입력해주세요.');
            return '0';
        }
    }

    var day1 = new Date(pDt.substring(0, 4), pDt.substring(4, 6) - 0 - 1, pDt
            .substring(6, 8), pTm.substring(0, 2), pTm.substring(2, 4));
    var day2 = new Date(nDt.substring(0, 4), nDt.substring(4, 6) - 0 - 1, nDt
            .substring(6, 8), nTm.substring(0, 2), nTm.substring(2, 4));

    var ms1 = Date.parse(day1); // 첫번째 날짜를 1/1000 값으로 환산
    var ms2 = Date.parse(day2); // 두번째 날짜를 1/1000 값으로 환산
    var sep = (ms2 - ms1) / 1000; // 두 날짜간의 시간차 (1/1000 초 이므로 초로 환산)

    var min = 60;
    var hour = min * 60;
    var day = hour * 24;

    var sd = parseInt(sep / day);
    var sh = parseInt((sep % day) / hour);
    var sm = parseInt((sep % hour) / min);
    var ss = sep % min;

    return sd + ',' + sh + ',' + sm + ',' + ss;
};


/**
 * 이메일 포맷 체크
 * @param str
 * @returns {Boolean}
 */
var gfn_isValidEmail = function(str) {
    var format = /^((\w|[\-\.])+)@((\w|[\-\.])+)\.([A-Za-z]+)$/;
    if (str.search(format) != -1)
        return true; // 올바른 포맷 형식
    return false;
};


/**
 * 한글 체크
 * @param str
 * @returns {Boolean}
 */
var gfn_isValidKorean = function(str) {
    // 유니코드 중 AC00부터 D7A3 값인지 검사
    var format = /^[\uac00-\ud7a3]*$/g;
    if (str.search(format) == -1)
        return false;
    return true; // 올바른 포맷 형식
};


/**
 * 공백제거
 * @param str
 * @returns {String}
 */
function gfn_trimAll(str){
    return str.replace(/^\s*/ ,"").replace(/\s*$/ ,"");
}


/**
 * 빈문자열 체크
 * @param str
 * @returns {Boolean}
 */
function gfn_isEmpty(str) {
    if(str == '') {
        return true;
    }
    if(str === undefined) {
        return true;
    }
    if(str == null) {
        return true;
    }
    if(str == 'null') {
        return true;
    }
    var type = typeof str;
    if( type == 'string'){
        if(str.replace(/\s/g, '') == '') {
            return true;
        }
    }
}


/**
 * 빈문자열 체크
 * @param str
 * @returns {Boolean}
 */
function gfn_isNotEmpty(str) {
    if(gfn_isEmpty(str) == true) {
        return false;
    }
    return true;
}


/**
 * 문자열 byte 길이(UTF8)
 * @param str
 * @returns {Number}
 */
function gfn_getByteLength(str) {
    var str_len = str.length;
    var byte_len = 0;
    for (i = 0; i < str_len; i++) {
        // 한글자추출
        one_char = str.charAt(i);
        // 한글이면 2를 더한다.
        if (escape(one_char).length > 4) {
            byte_len = byte_len + 3;
        }
        // 그외의 경우는 1을 더한다.
        else {
            byte_len++;
        }
    }
    return byte_len;
}


/**
 * 문자열 byte 자르기
 * @param str
 * @param len
 * @returns {String}
 */
function gfn_cutByte(str, len) {
    var l = 0;
    for (var i=0; i<str.length; i++) {
        l += (str.charCodeAt(i) > 128) ? 3 : 1;
        if (l > len) return str.substring(0,i) ;
    }
    return str;
}


/**
 * 끝나는거 찾기
 * @param str
 * @param pattern
 * @returns {Boolean}
 */
function gfn_endsWith(str, pattern) {
    if(isEmpty(str)) {
        return str;
    }
    var d = str.length - pattern.length;
    return d >= 0 && str.lastIndexOf(pattern) === d;
}


/**
 * 끝나는거 찾아서 자르기
 * ex) 100day에서 day로 찾아자르면 100이 리턴
 * @param str
 * @param pattern
 * @returns {Boolean}
 */
function gfn_endsWithCut(str, pattern) {
    var d = str.length - pattern.length;
    var endsFlag = d >= 0 && str.lastIndexOf(pattern) === d;
    if(endsFlag == true) {
        return str.substring(0, str.lastIndexOf(pattern));
    } else {
        return str;
    }
}


/**
 * 사업자 등록번호 유효성 체크
 * @param value
 * @returns {Boolean}
 */
function gfn_checkBizNo(value){
    var sumMod = 0;
    sumMod += parseInt(value.substring(0,1));
    sumMod += parseInt(value.substring(1,2)) * 3 % 10;
    sumMod += parseInt(value.substring(2,3)) * 7 % 10;
    sumMod += parseInt(value.substring(3,4)) * 1 % 10;
    sumMod += parseInt(value.substring(4,5)) * 3 % 10;
    sumMod += parseInt(value.substring(5,6)) * 7 % 10;
    sumMod += parseInt(value.substring(6,7)) * 1 % 10;
    sumMod += parseInt(value.substring(7,8)) * 3 % 10;
    sumMod += Math.floor(parseInt(value.substring(8,9)) * 5/10);
    sumMod += parseInt(value.substring(8,9)) * 5 % 10;
    sumMod += parseInt(value.substring(9,10));
    if(sumMod % 10 !=0){
        return false;
    }
    return true;
}


/**
 * 휴대전화 정규식
 * @param str
 * @returns {Boolean}
 */
function gfn_checkMobile(str){
    var regEx = /[01](0|1|6|7|8|9)(([-])|())(\d{4}|\d{3})(([-])|())\d{4}$/g;
    if(regEx.exec(str)){
        return true;
    }else{
        return false;
    }
}

/**
 * 전화번호 정규식
 * @param str
 * @returns {Boolean}
 */
function gfn_checkHomeTel(str){
	var regEx = /[0](\d{3}|\d{2}|\d{1})(([-])|())(\d{4}|\d{3})(([-])|())\d{4}$/g;
	if(regEx.exec(str)){
		return true;
	}else{
		return false;
	}
}

/**
 * 비밀번호
 * 영문 대/소문자, 숫자, 특수문자 조합으로 8~16자리
 * 사용 가능 특수문자 (-/:;()\&@.,?![]{}#%^*+=_|~$)
 * 연속된 숫자/문자,동일한 문자 3회 이상 사용불가
 * 개인정보와 관련된 생년월일, 핸드폰번호 뒤4자리, 아이디는 사용불가
 * @param password
 * @param str(생년월일, 핸드폰번호, 아이디)
 * @returns {Boolean}
 */
function gfn_pwReg(password, str){
	var aa = 0;
    var regEx1 = /[0-9]/gi;
    var regEx4 = /[-/:;()\&@.,?!\[\]{}#%^*+=_|~$]/gi;
    if(regEx1.exec(password)) {
        aa++;
    }
    if(password.toLowerCase() != password) {
        aa++;
    }
    if(password.toUpperCase() != password) {
        aa++;
    }
    if(regEx4.exec(password)) {
        aa++;
    }
    if(aa >= 2 && (password.length >= 8 && password.length <=16)){
    	if (/(\w)\1\1/.test(password)) { // 동일한 문자 3회 이상
    		return false;
    	}
    	if (!gfn_checkContinue(password, 3)) { // 연속된 숫자 3회 이상
    		return false;
        }
    	if (str != undefined && password.search(str) > -1) { // 개인정보 사용 불가
    		return false;
    	}
    	
    	return true;
    }
    
    return false;
}


/**
 * 모든 공백 사라짐 주의
 * @param str
 * @returns {String}
 */
function gfn_removeWhiteSpaces(str) {
    return str.replace(/\s+/g, "");
}


/**
 * 앞 뒤 트림
 * @param str
 * @returns {String}
 */
function gfn_trim (str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
}


/**
 * 파일 확장자 잘라내기
 * @param filename
 * @returns {String}
 */
function gfn_getFileExtension(filename) {
    return filename.split('.').pop();
}


/**
 * 폼을 배열 형태로 만들어준다
 * @param obj
 * @param arrayName
 * @param idx
 * @return (name -> arrayName[idx].name)
 */
function makeArrayForm(obj, arrayName, idx) {
    obj.find('input').each(function(i, item) {
        var type = $(this).attr('type')
        var name = $(this).attr('name');
        if(isEmpty(name)) {
            return true;
        }
        var oriName = getFileExtension(name.toString());
        if(type == 'text' || type == 'file' || type=='radio') {
            $(this).attr('name', arrayName+'['+idx+'].'+oriName);
        }

    });
    obj.find('textarea').each(function(i, item) {
        var type = $(this).attr('type')
        var name = $(this).attr('name');
        if(isEmpty(name)) {
            return true;
        }
        var oriName = getFileExtension(name.toString());
        $(this).attr('name', arrayName+'['+idx+'].'+oriName);
    });
}


/**
 * YYYYMMDD형으로 변환
 * @returns {String}
 */
function gfn_yyyymmdd(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};

function fn_moneyKeyUp($obj) {
	var text = $obj.val();
	text = text.replace(/[^0-9|-]/g,'');
	text = Number(text);
	text = fn_wonFormat(text);
	$obj.val(text);  
}


/**
 * YYYYMMDD형으로 변환
 * @returns {String}
 */
function gfn_yyyymmddhhmm(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();
    var hour = date.getHours().toString();
    var minute = date.getMinutes().toString();
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + (hour[1]?hour:"0"+hour[0]) + ':' + (minute[1]?minute:"0"+minute[0]);
};


/**
 * 전화번호 '-' 변환
 * @param str
 * @returns {String}
 */
function gfn_phoneFormat(str) {
    var telno = str.replace(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/, "$1-$2-$3");
    return telno;
}

/**
 * 넘버 체크
 * @param event
 * @returns {boolean}
 */
function gfn_isNumber($obj) { 
	if ($obj != undefined) {
		$obj.val($obj.val().replace(/[^0-9]/g,''));
	} else {
		if(event.keyCode<48 || event.keyCode>57){
			event.returnValue=false;
		}
	}
}


/**
 * 입력 패턴 날짜 문자열로 변환
 * @param date
 * @param pattern
 * @returns {String}
 */
function gfn_patternDate(date, pattern) {
    var yy = date.getYear().toString();
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = date.getDate().toString();
    var hour = date.getHours().toString();
    var minute = date.getMinutes().toString();
    var second = date.getSeconds().toString();

    pattern = pattern.replace('yyyy',yyyy);
    pattern = pattern.replace('yy',pad(yy));
    pattern = pattern.replace('MM',pad(mm));
    pattern = pattern.replace('dd',pad(dd));
    pattern = pattern.replace('HH',pad(hour));
    pattern = pattern.replace('mm',pad(minute));
    pattern = pattern.replace('ss',pad(second));

    return pattern;
};


/*
 * 3자리 콤마 넣기
 */
function fn_wonFormat(num) {
	num = num + ""; 
	var point = num.length % 3 ;
	var len = num.length; 	  
	var str = num.substring(0, point); 
	while (point < len) { 
		if (str != "") str += ","; 
			str += num.substring(point, point + 3); 
	        point += 3; 
	    } 
	return str;
}

/*
 * 콤마 제거
 */ 
function fn_removeWonFormat(str) {
	str = str.replace(/[^0-9]/g,"");
	var strSplit = str.split(",");
	var resultStr = "";
	for(var i=0; i<strSplit.length; i++) {
		resultStr += strSplit[i]; 
	}
	return Number(resultStr);
}



/**
 * onKeyDown Event 전화번호 자동 변환
 * @param obj
 * @returns {String}
 */
function gfn_onKeyDownCheckPhone(obj) {
    var sMsg = obj.value ;
    var onlynum = "" ;
    onlynum = gfn_removeDash(sMsg);
    if(event.keyCode != 8){
        if (gfn_getMsgLen(onlynum) <= 2) obj.value = onlynum ;
        if (gfn_getMsgLen(onlynum) == 3) obj.value = onlynum + "-";
        if (gfn_getMsgLen(onlynum) == 4) {
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) ;
        }
        if (gfn_getMsgLen(onlynum) == 5){
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) ; // 010-11
        }
        if (gfn_getMsgLen(onlynum) == 6) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,6) ;
        if (gfn_getMsgLen(onlynum) == 7) { // 8
        	obj.value = onlynum.substring(0,1) + "-" + onlynum.substring(1,4) + "-" + onlynum.substring(4,8);
        }
        if (gfn_getMsgLen(onlynum) == 8) { // 9
        	obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,5) + "-" + onlynum.substring(5,8);
        }
        if (gfn_getMsgLen(onlynum) == 9) {// 10
        	obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,6) + "-" + onlynum.substring(6,9);
        }
        if (gfn_getMsgLen(onlynum) == 10) { // 11
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,7) + "-" + onlynum.substring(7,10);
        }
        if (gfn_getMsgLen(onlynum) == 11) { // 12
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,7) + "-" + onlynum.substring(7,11);
        }
    }
}


/**
 * onKeyUp Event 전화번호 자동 변환
 * @param obj
 * @param e (event)
 * @returns {String}
 */
function gfn_onKeyUpCheckPhone(obj, e) {
    var keyCode = (window.netscape) ? e.which : e.keyCode;
    var sMsg = obj.value;
    var onlynum = "";
    onlynum = gfn_removeDash(sMsg);

    var temp = "";
    if(gfn_getMsgLen(onlynum) >= 2){
        temp = onlynum.substring(0,2);
        if(temp == '02'){
            if(gfn_getMsgLen(onlynum) >= 10 || keyCode != 8){
                if (gfn_getMsgLen(onlynum) <= 2) obj.value = onlynum ;
                if (gfn_getMsgLen(onlynum) == 3) obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,3) ;
                if (gfn_getMsgLen(onlynum) == 4) obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,4) ;
                if (gfn_getMsgLen(onlynum) == 5) obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,5) ;
                if (gfn_getMsgLen(onlynum) == 6) obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,6) ;

                if (gfn_getMsgLen(onlynum) == 7)  obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,5) + "-" + onlynum.substring(5,7);
                if (gfn_getMsgLen(onlynum) == 8)  obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,5) + "-" + onlynum.substring(5,8);
                if (gfn_getMsgLen(onlynum) == 9)  obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,5) + "-" + onlynum.substring(5,9);
                if (gfn_getMsgLen(onlynum) == 10) obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,6) + "-" + onlynum.substring(6,10);
                if (gfn_getMsgLen(onlynum) == 11) obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,6) + "-" + onlynum.substring(6,11);
            }
        } else{
            if(gfn_getMsgLen(onlynum) >= 10 || keyCode != 8){
                if (gfn_getMsgLen(onlynum) <= 2) obj.value = onlynum ;
                if (gfn_getMsgLen(onlynum) == 3) obj.value = onlynum + "-";
                if (gfn_getMsgLen(onlynum) == 4) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,4) ;
                if (gfn_getMsgLen(onlynum) == 5) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) ;
                if (gfn_getMsgLen(onlynum) == 6) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,6) ;
                if (gfn_getMsgLen(onlynum) == 7) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,7) ;

                if (gfn_getMsgLen(onlynum) == 8)  obj.value = onlynum.substring(0,1) + "-" + onlynum.substring(1,4) + "-" + onlynum.substring(4,8);
                if (gfn_getMsgLen(onlynum) == 9)  obj.value = onlynum.substring(0,2) + "-" + onlynum.substring(2,5) + "-" + onlynum.substring(5,9);
                if (gfn_getMsgLen(onlynum) == 10) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,6) + "-" + onlynum.substring(6,10);
                if (gfn_getMsgLen(onlynum) == 11) obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,7) + "-" + onlynum.substring(7,11);
            }
        }
    }
};


/**
 * 사업자 번호 '-' 변환
 * @param obj
 * @returns {String}
 */
function gfn_onKeyDownCheckBusinessNum(obj) {
    var sMsg = obj.value ;
    var onlynum = "" ;
    onlynum = gfn_removeDash(sMsg);
    if(event.keyCode != 8 ) {
        if (gfn_getMsgLen(onlynum) <= 2) obj.value = onlynum ;
        if (gfn_getMsgLen(onlynum) == 3) obj.value = onlynum + "-";
        if (gfn_getMsgLen(onlynum) == 4) {
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) ;
        }
        if (gfn_getMsgLen(onlynum) == 5){
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) + "-"; // 010-11
        }
        if (gfn_getMsgLen(onlynum) == 6) { // 7
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) + "-" + onlynum.substring(5,6);
        }
        if (gfn_getMsgLen(onlynum) == 7) { // 8
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) + "-" + onlynum.substring(5,7);
        }
        if (gfn_getMsgLen(onlynum) == 8) { // 9
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) + "-" + onlynum.substring(5,8);
        }
        if (gfn_getMsgLen(onlynum) == 9) { // 10
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) + "-" + onlynum.substring(5,9);
        }
        if (gfn_getMsgLen(onlynum) == 10) { // 11
        	obj.value = onlynum.substring(0,3) + "-" + onlynum.substring(3,5) + "-" + onlynum.substring(5,10);
        }
    }
}


/**
 * '-' 삭제
 * @param str
 * @returns {String}
 */
function gfn_removeDash(sNo) {
    var reNo = "";
    for(var i=0; i < str.length; i++){
        if(str.charAt(i) != "-"){
            reNo += str.charAt(i);
        }
    }
    return reNo;
}


/**
 * 
 * @param str
 * @returns {String}
 */
function gfn_getMsgLen(str) { // 0-127 1byte, 128~ 2byte
    var count = 0
    for(var i=0; i < str.length; i++){
        if(str.charCodeAt(i) > 127){
            count += 2;
        } else {
            count++;
        }
    }
    return count;
}


/**
 * 콤마 찍기
 * @param str
 * @returns {String}
 */
function gfn_comma(str) {
    str = String(str);
    return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}


/**
 * 콤마 삭제
 * @param str
 * @returns {String}
 */
function gfn_uncomma(str) {
    str = String(str);
    return str.replace(/[^\d]+/g, '');
}

/**
 * 
 * @param str
 * @param limit
 * @returns {Boolean}
 */
function gfn_checkContinue(str, limit) {
    var o, d, p, n = 0, l = limit == null ? 4 : limit;

    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (i > 0 && (p = o - c) > -2 && p < 2 && (n = p == d ? n + 1 : 0) > l - 3) return false;
        d = p, o = c;
    }

    return true;
}


/**
 * 공통코드가져오기
 * {
	objId : select box id
	, defaultOption : S('선택') 그외 '전체'
	, defaultVal : 기본선택값
	, commTp : 공통그룹코드
	, highCommCd : 상위공통코드
	, valCol : commCd 컬럼외 값 사용시 사용
   }
 **/
function gfn_commonCode(data, fn_callbak){
	$.ajax({
		url : "/onnuri/common/code"
		, dataType : "json" /* html, json */
		, contentType: "application/json"
		, data : {commTp : data.commTp, highCommCd : data.highCommCd}
  		, success : function(result){
  			$('#' + data.objId + ' option').remove();
  			if(data.defaultOption == "S"){
  				var option = "<option value=''>선택</option>";
  				$('#' + data.objId).append(option);
  			}else{
  				var option = "<option value=''>전체</option>";
  				$('#' + data.objId).append(option);
  				
  			}
  			$.each(result.data, function() {
  				var val = '';
  				if(data.valCol != undefined && data.valCol != ""){
  					val = this[data.valCol];
  				}else{
  					val = this.commCd;
  				}
  				var option = "<option value="+ val +">" + this.commCdNm + "</option>";
  				$('#' + data.objId).append(option);
  			});
  			
			if(data.defaultVal != undefined && data.defaultVal != ""){
				$('#' + data.objId).val(data.defaultVal).prop('selected', true);
			}
			

			if (fn_callbak) {
				if (typeof fn_callbak === 'function') {
					fn_callbak.call(window, data);
				}
				else if (typeof fn_callbak === 'string') {
					eval(fn_callbak + '.call(window, data)');
				}
			}
			console.log("success");
  		}
	});	
}

function gfn_commonCodeTypeString(paramCommTp, paramHighCommCd){
	
	var optionHtml = "";
	
	$.ajax({
		url : "/onnuri/common/code"
		, dataType : "json" /* html, json */
		, contentType: "application/json"
		, async : false
		, data : {commTp : paramCommTp, highCommCd : paramHighCommCd}
  		, success : function(result){
  			
  			$.each(result.data, function() {
  				optionHtml += "<option value="+ this.commCd +">" + this.commCdNm + "</option>";
  			});
  			
			console.log("success");
  		}
	});	
	
	return optionHtml;
}

/**
 * 최근에 본 상품 저장
 * {
	goodsId : 상품 아이디
	, goodsImg : 상품 이미지
   }
 **/
function gfn_addCookieRecetlyGoods(goodsId, goodsImg, ctgCd) {
	/**
	 * 1. 조회
	 * 2. 중복체크
	 * 3. 쿠키 삽입
	 *    3-1. 최신걸 가장 위로 올린다.
	 *    3-2. maxCount만큼 쿠키를 저장한다.  
	 * 4. 미사용 쿠키 삭제 
	 */
	
	var maxCount = 10; 
	var expires = 7; 
	
	// 1. 조회 
	var recetlyGoodsMap = gfn_getRecetlyGoods();
	var goodsIdList = recetlyGoodsMap.goodsIdList;
	var goodsImgUrlList = recetlyGoodsMap.goodsImgUrlList;
	var goodsCtgCdList = recetlyGoodsMap.goodsCtgCdList;
	var newGoodsIdList = [];
	var newGoodsImgUrlList = [];
	var newGoodsCtgCdList = [];
	
	//2. 중복체크
	for(var i=0; i<goodsIdList.length; i++) {
		if(goodsId == goodsIdList[i]) {		//중복이면..
			newGoodsIdList.push(goodsIdList[i]);
			newGoodsImgUrlList.push(goodsImgUrlList[i]);
			newGoodsCtgCdList.push(goodsCtgCdList[i]);
			
			//중복을 제거
			var idx = goodsIdList.indexOf(goodsId);
			goodsIdList.splice(idx, 1);
			goodsImgUrlList.splice(idx, 1);
			goodsCtgCdList.splice(idx, 1);
			break;
		}
	}
	
	var path = "/"; 
	
	//3. 쿠키 삽입
	$.cookie("gi_0", goodsId, { expires: expires, path: path });
	$.cookie("gim_0", goodsImg, { expires: expires, path: path });
	$.cookie("gic_0", ctgCd, { expires: expires, path: path });
	for(var i=0; i<goodsIdList.length; i++) {
		$.cookie("gi_"+ (i+1), goodsIdList[i], { expires: expires, path: path });
		$.cookie("gim_" + (i+1), goodsImgUrlList[i], { expires: expires, path: path }); 
		$.cookie("gic_" + (i+1), goodsCtgCdList[i], { expires: expires, path: path }); 
	}
	
	//4. 미사용 쿠키 삭제
	$.removeCookie("gi_"  + maxCount, {path: path});
	$.removeCookie("gim_" + maxCount, {path: path});
	$.removeCookie("gic_" + maxCount, {path: path});
		
}


/**
 * 최근에 본 상품 조회
 * {
	goodsId : 상품 아이디
	, goodsImg : 상품 이미지
   }
 **/
function gfn_getRecetlyGoods() { 
	var resultData = {};
	var goodsIdList = [];
	var goodsImgUrlList = [];
	var goodsCtgCdList = [];
	var maxCount = 10;
	
	
	for(var i=0; i<maxCount; i++) {
		var id = $.cookie('gi_' + i);
		if(id != null && id != "undefined") {
			goodsIdList.push(id);
			goodsImgUrlList.push($.cookie('gim_' + i));
			goodsCtgCdList.push($.cookie('gic_' + i));
		}
	} 
	
	resultData["goodsIdList"] = goodsIdList;
	resultData["goodsImgUrlList"] = goodsImgUrlList;
	resultData["goodsCtgCdList"] = goodsCtgCdList;
	return resultData;
}


/**
 * 배너정보로 링크 URL 조회
 * {
	bannerData : 배너 정보
   }
 **/

function gfn_getLinkUrlByBannerData(landingDiv,ctgCd,goodsCd,planCd,eventCd,prmCd,landingUrl,newWindowYn) {
	
	var linkType = landingDiv;
	var linkUrl = "";
	
	if(linkType == "01") {						//프로모션	
		//linkUrl = "/onnuri/promotion/detail?promotionCd=" + prmCd + "&ctgCd=" + ctgCd;
		linkUrl = "/onnuri/promotion/prmGoodsList?prmCd=" + prmCd;
	}
	else if(linkType == "02") {				//기획전
//		linkUrl = "/onnuri/plan/planDetail?planCd=" + planCd + "&ctgCd=" + ctgCd;
		linkUrl = "/onnuri/plan/planDetail?planCd=" + planCd;
	}
	else if(linkType == "03") {				//상품
		var isSucc = false;
		getDispCtgCdInDispTemplet(goodsCd, '', function(data) {
			if(data != null && data !== undefined && data.respCtgCd != null && data.respCtgCd !== undefined) {
				linkUrl = "/onnuri/goods/detail?goodsCd=" + data.goodsCd + "&ctgCd=" + data.respCtgCd; 
				if(newWindowYn == "Y") {
					linkUrl = linkUrl + "&newWindowYn=Y";
					window.open(linkUrl, '_blank');
				}
				else {
					location.href = linkUrl;
				}
				isSucc = true;
			} else {
				alert("전시카테고리에 등록되지 않은 상품입니다."); 
				return;
			}
			
		}); 
	}
	else if(linkType == "04") {				//전시카테고리
		var isSucc = false;
		getDispCtgCdInDispTemplet('', ctgCd, function(data) { 
			if(data != null && data !== undefined && data.respCtgCd != null && data.respCtgCd !== undefined) {
				if(data.ctgLvl == 1) {
					linkUrl = "/onnuri/main/submain?ctgCd=" + data.respCtgCd;  
				} else {
					linkUrl = "/onnuri/goods/list?ctgCd=" + data.respCtgCd + "&callType=CATE" + data.ctgLvl;  
				} 
				if(newWindowYn == "Y") {
					linkUrl = linkUrl + "&newWindowYn=Y";
					window.open(linkUrl, '_blank');
				}
				else {
					location.href = linkUrl;
				} 
				isSucc = true;
			}
			else {
				alert("전시카테고리에 등록되지 않은 상품입니다.");
				return;  
			}
			
		});  
	}
	else if(linkType == "05") {				//이벤트
		//linkUrl = "/onnuri/event/detail?eventCd=" + eventCd  + "&ctgCd=" + ctgCd;;
		linkUrl = "/onnuri/event/eventDetail?eventCd=" + eventCd;
	}
	else if(linkType == "06") {	 			//URL
		if(landingUrl.indexOf("http") < 0 && landingUrl.indexOf("onnuri") < 0){
			return;
		}
		linkUrl = landingUrl; 
	}
	
	if((linkType == "03" || linkType == "04") && isSucc == false) {
		return;
	}
	 
	if(newWindowYn == "Y") { 
		
		if(linkType == "06"){
			linkUrl = linkUrl + "?newWindowYn=Y";
		}
		else {
			linkUrl = linkUrl + "&newWindowYn=Y";
		}
		window.open(linkUrl, '_blank');
	}
	else {
		window.open(linkUrl, '_self');   
	}
}

/* 
 * 전시카테고리에 포함된 상품이나 카테고리 조회 
 */
function getDispCtgCdInDispTemplet(goodsCd, ctgCd, fn_callbak) {
	$.ajax({
		url : "/onnuri/common/getDispCtgCdInDispTemplet"
		, dataType : "json" 
		, data : { goodsCd : goodsCd, ctgCd : ctgCd}   
		, async : false
		, global : false   
		, success : function(data){
			if (fn_callbak) {
				if (typeof fn_callbak === 'function') {
					fn_callbak.call(window, data);
				}
				else if (typeof fn_callbak === 'string') {
					eval(fn_callbak + '.call(window, data)');
				}
			}
		}
	});
}

//특수문자 변환  
function fn_specialChar (str){   
	  
	if(str.indexOf("[") != -1){
		str = str.replace(/\[/gi,"%5B");
	}
	
	if(str.indexOf("]") != -1){
		str = str.replace(/\]/gi,"%5D");
	}
	
	if(str.indexOf("{") != -1){
		str = str.replace(/\{/gi,"%7B");
	}
	
	if(str.indexOf("}") != -1){
		str = str.replace(/\}/gi,"%7D");
	}
	
	if(str.indexOf("|") != -1){ 
		str = str.replace(/\|/gi,"%7C");
	}
	
	return str;
}


//장바구니 배지 카운트 수정
function fn_updateBaskectCount(count) {
	$("#basketCnt").text(count);
	$("#quickBasketCnt").text(count);
}

//주문/배송 배지 카운트 수정
function fn_updateOrderCount(count) {
	$("#orderCnt").text(count);
}

//최근에 본 상품 갱신
function fn_refrashSideMenu() {
	var recetlyGoodsMap = gfn_getRecetlyGoods(); 
	var goodsIdList = recetlyGoodsMap.goodsIdList;
	var goodsImgUrlList = recetlyGoodsMap.goodsImgUrlList;
	var goodsCtgCdList = recetlyGoodsMap.goodsCtgCdList;
	var html = "";
	
	if(goodsIdList.length == 0) {		//최근 본 상품이 없으면...
		html += '<div id="emptyGoodsDiv" class="t_cell" style="display: none;">';
		html += '\t<div class="tac">';
		html += '\t\t<p>최근본상품이 <br>없습니다.</p>';
		html += '\t\t</div>';
		html += '\t</div>'; 
		
		$("#quickDiv").html(html); 
		return;
	}
	else {
		for(var i=0; i<goodsIdList.length; i++) {
			html += '<a href="#a" data-index="'+ i +'"><img class="lazy sendTargetSectionLog" data-ezpage="MAIN" data-ezcategory="우측퀵메뉴" data-ezdetail="'+ goodsIdList[i] +'" data-size="260x260" data-src="'+ $("#contextPath").val() + goodsImgUrlList[i] +' " onclick="fn_moveGoodsDetailForATag('+ goodsIdList[i] +','+ goodsCtgCdList[i] + ');"> </a>'  
		}
	}
	
	$("#quickDiv").html(html);
	$("#quickRecentGoodsCnt").text(goodsIdList.length); 
}

// JSON PARSE
function fn_JsonParse(str) {
	str = str.replace(/\n/gi, '<br>'); // 개행처리
	return JSON.parse(str);
}

function fn_moveGoodsDetailForATag(goodsCd, ctgCd) {

	fn_goGoodsDetail(goodsCd, ctgCd , '');
	
}

function fn_movePrmGoodsDetailForATag(goodsCd, ctgCd, prmCd) {
	
	fn_goPrmGoodsDetail(goodsCd, ctgCd, '' , prmCd, prmTabCd);

}


/**
 * 우편번호 검색 팝업 호출
 * @param   String post : 우편번호 input id
 * @param   String addr1 : 주소1 input id 
 * @param   String addr2 : 주소2 input id 
 */
function gfn_getAddrSearchPop(post, addr1, addr2){
	NEW2015_pZip('/onnuri/common/addrSearchPop', post, addr1, addr2);		
}





/**
 * 로그인
 */
function gfn_login(gubun) {
	
	var userId	= $("#userId").val();
	var userPwd	= $("#userPwd").val();
	//var fwdUrl	= $("#fwdUrl").val().replace('||','&');
	var fwdUrl = gfn_ReplaceAll($("#fwdUrl").val(), "||", "&");
	
	if(!userId){
		alert("아이디를 입력하세요.");
		$("#userId").focus();
		return;
	}
	
	if(!userPwd){
		alert("비밀번호를 입력하세요.");
		$("#userPwd").focus();
		return;
	}
	
	$.ajax({
		type : "POST"
		, url : "/onnuri/login"
		, dataType : "html" /* html, json */
		, data : {userId : userId, userPwd : userPwd, fwdUrl: fwdUrl}
		, success : function(data){
			var result = JSON.parse(data);
			if(result.result == 'success'){
				//alert('로그인하였습니다.');
				if (gubun != undefined) {
					$("#loginPopup").css("display", "none");
					$("#loginYn").val("Y");
				} else {
					var targetUrl = '/onnuri/main';
					if( result.targetUrl ) {
						targetUrl = result.targetUrl;
					}
					
					// 동행세일 관련 추가
					// 동행세일로 접근시 로그인 후 상품상세로 이동
					if( window.sessionStorage.getItem('afterLoginForwardUrl') ) {
						targetUrl = window.sessionStorage.getItem('afterLoginForwardUrl');
						window.sessionStorage.removeItem('afterLoginForwardUrl');
					}

					document.location.href = targetUrl;
				}
			}else{
				alert(result.result);
				if (result.rtnUrl != "") {
					// 계정 잠금여부 
					var locked = result.locked;
					gfn_getMenuContent2(result.rtnUrl, {userId : userId, userPwd : userPwd, locked : locked});
				} else {
					$("#userId").focus();
				}
			}
		}
	});
}

// 낫 익스플로러 사이즈 파일 업로드 사이즈 체크
function validateFileSizeOther($fileObj, limit){
	if($fileObj.val() == ''){
		alert('파일을 등록하세요.');
		return;
	}

	var size = $fileObj[0].files[0].size;

	if(size > limit *1024 * 1024){  //1mb
		alert('파일의 용량이 너무 큽니다. 다시 확인해주세요');
		$fileObj.val('');		
		$fileObj.siblings('.file_name').val(''); 
	} else {
		var filename = $fileObj[0].files[0].name;
		$fileObj.siblings('.file_name').val(filename);
	}
}

// 익스플로러 사이즈 파일 업로드 사이즈 체크
function validateFileSizeIE($fileObj, limit){
	var myFSO = new ActiveXObject("Scripting.FileSystemObject");
	var filePath = $fileObj.val();

	if(filePath == ''){
		alert('파일을 등록하세요.');
		return;
	}

	var thisFile = myFSO.getFile(filePath);
	var size = thisFile.size;
	if(size > limit *1024 * 1024){  //1mb
		alert('파일의 용량이 너무 큽니다. 다시 확인해주세요');
		$fileObj.val('');		
		$fileObj.siblings('.file_name').val(''); 
	} else {
		var filename = $fileObj.val().split('/').pop().split('\\').pop(); // 파일명만 추출
		$fileObj.siblings('.file_name').val(filename);
	}
}

//파일 존재여부 함수 정의
function fn_fileExists(datas, func) {
	$.ajax({
		url : "/onnuri/common/downloadCheck"
		, dataType : "json" /* html, json */
		, contentType: "application/json"
		, data : datas
		, async : false 
		, success : function(data){
			console.log("success")
			
			if (func != undefined) {
				if (typeof func === 'function') {
					func();
				}
			}
			fn_fileDownload(datas);
		}
	});
}

//파일다운로드 함수 정의
function fn_fileDownload(data) { 
	var form = document.createElement("form");
	
	var hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "filePath");
	hiddenField.setAttribute("value", data.filePath);
	form.appendChild(hiddenField);
	
	hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "tmpFileName");
	hiddenField.setAttribute("value", data.tmpFileName);
	form.appendChild(hiddenField);
	
	hiddenField = document.createElement("input");
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "orgFileName");
	hiddenField.setAttribute("value", data.orgFileName);
	form.appendChild(hiddenField);
	
	form.name = "downloadForm";
	form.method = "post";
	form.action = "/onnuri/common/download";
	document.body.appendChild(form);
	form.submit();
	document.body.removeChild(form);
}

/*
 * 장바구니 추가
 * 
 * var data = JSON.stringify([{
 *		  'goodsCd'     : ''		// 상품코드(필수)
 * 		, 'dispCtg'     : ''		// 상품전시카테고리(필수)
 *		, 'goodsDtlNum' : ''		// 상품상세순번(선택) 상품에 옵션이 있는경우
 * 		, 'qty'         : 3			// 수량(선택) 없을 경우 1로 들어감
 * }]);
 * 
 * callback 필요 없을 시
 * 		fn_insertOrderBasket(data);
 * 
 * callback 필요한 경우  
 * 		1. 
 * 		fn_insertOrderBasket(data, fn_insertBasketCallback);
 * 
 *		function fn_insertBasketCallback(data) {
 *			// 내용 서술
 *		} 
 * 
 *		2.
 *		fn_insertOrderBasket(data, function(data) {
 *			// 내용 서술
 *		});
 */
function fn_insertOrderBasket(data, fn_callbak) {
	$.ajax({
		  type        : 'POST'
		, contentType : 'application/json'
		, dataType    : 'json'
		, url         : '/onnuri/order/basket/insertBasket'
		, data        : data
		, success     : function(data) {
			
			if (data.errorCode) {
				alert(data.errorMessage);
				return;
			}
			
			// 장바구니 갯수 업데이트
			fn_updateBaskectCount(Number($("#basketCnt").text()) + data.insertCnt);
			
			if (fn_callbak) {
				if (typeof fn_callbak === 'function') {
					fn_callbak.call(window, data);
				}
				else if (typeof fn_callbak === 'string') {
					eval(fn_callbak + '.call(window, data)');
				}
			}
		}
	});
}


/*
 * 주문 페이지 이동
 * 
 * ex)
 * var data = [
 * 		// 주문기본(옵션)
 * 		'order' : {
 * 			'' : ''
 * 		}
 *		// 주문상품(필수)
 * 		, "orderGoods":[{
 * 			  'goodsCd'     : ''	// 상품코드(필수)
 *		  	, 'goodsSubNum' : ''	// 상품상세순번(필수)
 * 			, 'dispCtg'     : ''	// 상품전시카테고리(필수)
 * 			, 'qty'         : '3'	// 수량(선택) 없을 경우 1로 들어감
 * 		}]
 * }];
 * 
 * fn_insertOrderCk(data);
 */
function fn_insertOrderCk(data, url) {
	if (!data.order) {
		data.order = {
			basketYn : 'N'		// 장바구니여부
		}
	}
	
	//gfn_getMenuContent('/onnuri/order/order', JSON.stringify(data), JSON_RESETTINGS);
	
	var form = document.createElement('form');
	form.setAttribute('charset', 'UTF-8');
	form.setAttribute('method' , 'post');  //Post 방식
	form.setAttribute('action' , '/onnuri/order/order'); //요청 보낼 주소
	
	var hiddenField = document.createElement('input');
	hiddenField.setAttribute('type', 'hidden');
	hiddenField.setAttribute('name', 'formData');
	hiddenField.setAttribute('value', JSON.stringify(data));
	form.appendChild(hiddenField);
	
	document.body.appendChild(form);
	
	form.submit();
}

function fn_validate(target) {
	var classArray, validate_t, validate_v, inputText, isSuccess = true;
	$(target).find('[class*=validate_t]').each(function() {
		classArray = $(this).attr('class').split(' ');
		for (var index in classArray) {
			// validation title이 있으면 해당 값으면 validation value 찾기
			validate_t = classArray[index];
			if (validate_t.indexOf('validate_t') > -1) {
				validate_v = validate_t.replace('validate_t', 'validate_v');
				$(target).find('.' + validate_v).each(function() {
					// 체크박스
					if ($(this).context.type == 'checkbox') {
						if (!$(this).is(':checked')) {
							isSuccess = false;
							inputText = '체크';
						}
					}
					// 그외
					else {
						if (!$(this).val()) {
							isSuccess = false;
							inputText = this.tagName == 'INPUT' ? '입력' : '선택';
						}
					}
					
					if (!isSuccess) {
						alert($.trim($(target).find('.' + validate_t).text().replace('*', '')) + '을(를) ' + inputText + '해주세요.');
						$(this).focus();
						return false;
					}
				});
			}
			
			if (!isSuccess) {
				break;
			}
		}
		
		if (!isSuccess) {
			return false;
		}
	});
	
	return isSuccess;
}


function fn_clickMenu(url, mkUserKey, isJumpPage) { 
	if(mkUserKey == null || mkUserKey == "undefined" || mkUserKey == "") { 
		location.href = "/onnuri/login/loginForm?fwdUrl=" + encodeURIComponent(url);
//		location.href = url;
		return false;
	} else {
		if(isJumpPage == true) {
			location.href = url;
		} else {
			return true;
		}
	}
	return false;
}

// 나의 신청보기 클릭 함수
function fn_clickMenuMyApply(mkuserKey) {
	$.ajax({
		  url : "/onnuri/common/getMyApplyInfo"
		, dataType : "html" /* html, json */
		, success : function(data){
			console.log("success");
			
			console.log(data);
			$("#myApplyDiv").html(data);
		}
	});
	
	$('.popup.my_info').show();
}

/**
 * 로그인 페이지 이동 (현재페이지 정보 전달)
 * @returns
 */
function fn_goLogin(fwdUrl) {
	if( !fwdUrl) {
		fwdUrl = location.pathname + location.search;
	}
	location.href = "/onnuri/login/loginForm?fwdUrl=" + encodeURIComponent(fwdUrl);
}


//상품 개수 업
function fn_countUp($obj) {
	var $cnt = $(".count", $obj.closest("div")); 
	var count = Number($cnt.val());
	$cnt.val(++count); 
}

// 상품 개수 다운
function fn_countDown($obj) {
	var $cnt = $(".count", $obj.closest("div"));
	var count = Number($cnt.val());
	--count;
	if(count <= 1) {
		count = 1;
	}
	$cnt.val(count);
}

function iframeResize() {

	var h = $('.cke_wysiwyg_frame').contents().height() ;
	$('.cke_wysiwyg_frame').css("height", h-10);

	if ( $('#cke_descRegDivArea_1002').length )	$('#cke_descRegDivArea_1002, .cke_inner, #cke_1_contents').css("height", h); // PC 리사이즈

}


/**
 * CKEDITOR Config 설정
 **/
CKEDITOR.on('dialogDefinition', function(ev){
    var dialogName = ev.data.name;
    var dialogDefinition = ev.data.definition;

    switch (dialogName) {
        case 'image': //Image Properties dialog
        //dialogDefinition.removeContents('info');
        dialogDefinition.removeContents('Link');
        dialogDefinition.removeContents('advanced');
        break;
    }
});
// 자동 높이 리사이징
function gfn_setCkeditorConfig(id) {
	if ($("#"+id).prop("scrollHeight") > 1) {
		CKEDITOR.replace(id,{ height : $("#"+id).prop("scrollHeight")});
	} else {
		CKEDITOR.replace(id);
	}
	
	var rawHTML = $("#"+id).val();
	var maxWidth = $("#"+id).width();
	var $div = $("<div>").html(rawHTML);


	$div.find("img[src*='.png'], img[src*='.jpg']").each( function(){ //imgProxy 적용
		var orgSrc = $(this).attr("src").trim();
		var pcode = (orgSrc.indexOf("?") >= 0) ? "&":"";

		$(this).attr("onerror", "this.onerror=null;this.src='"+orgSrc+"'");
		$(this).addClass("ic_images");
		$(this).attr("src", "//static.ezwelfare.net/EXTSRC/" + orgSrc + pcode);
	});

	var processedHTML = $div.html();
	$("#"+id).val(processedHTML);
	
	$(".cke").css("border","none");
	$(".cke_reset").css("border","none");
	$(".cke_inner").css("border","none");
	$(".cke_contents").css("border","none");
	$(".cke_show_borders").css("border","none");
	$(".cke_show_borders").css("border","none");
	
}
// 지정 높이 & 수직 스크롤바 생성 : 기본 10px
function gfn_setCkeditorConfig_v2(id, height) {
	CKEDITOR.replace(id, { width : "100%", height : height });
	CKEDITOR.editorConfig = function( config ) {
		config.allowedContent = true;
		config.height = height;
		config.width = '100%';
		config.resize_enabled = false;
		config.removePlugins = 'autogrow';
	};
	$(".cke").css("border","none");
	$(".cke_reset").css("border","none");
	$(".cke_inner").css("border","none");
	$(".cke_contents").css("border","none");
	$(".cke_show_borders").css("border","none");
}

/**
 * 0을 붙여 두 자리수로 변경하여 반환 (날짜 형식에 사용)
 * @param target
 * @returns {String}
 */
function cfSetAddZero(target) {      
	 
    var num = parseInt(target);
    
    var str = num > 9 ? num : "0" + num;
    
    return str.toString();
}


// 장바구니 담기
function fn_basketForMain($obj, type, optPhaseDiv, mkUserKey) {
	
	if(mkUserKey == null || mkUserKey == "undefined" || mkUserKey == "") {
		fn_clickMenu("/onnuri/main", mkUserKey, false);
		return;
	}
	
	
	if(type == 1) {	// 1.옵션이 있는 상품
		if ($obj.closest('.hidn_btn').length > 0){
			var $div = $obj.closest(".blink");
		}else if ($obj.closest('.exp_area').length > 0){
			var $div = $obj.closest(".goods_define");
		}else{
			var $div = $obj.closest(".goods_intro");
		}
		var imgSrc = $div.siblings("a").find("figure > img").attr("src");

		if( $div.length < 1 ) {
			$div = $obj.closest('li');
			imgSrc = $div.find("figure > img").attr("src");
		}else{
			//$div = $obj.closest('.blink');
			if($div.hasClass("goods_intro")){
				var $div2 = $div.siblings('a');
				imgSrc = $div2.find("figure > img").attr("src");
			}else if($div.hasClass("blink")){
				imgSrc = $div.find("figure > img").attr("src");
			}else if($div.hasClass("goods_define")){
				var $div2 = $div.siblings('a');
				imgSrc = $div2.find("figure > img").attr("src");
			}else{
				var $div2 = $div.closest('product_3').find('a');
				imgSrc = $div2.find("figure > img").attr("src");
			}
				
				//imgSrc = $div.find("figure > img").attr("src");	
			
		}

		var marketNm = $("dt", $div).text();
		var goodsNm = $div.find("dl .ellipsis_2", $div).text();  
		
		$("#optPopImg").attr("src", imgSrc);
		$("#optPopMarketNm").text(marketNm);
		$("#optPopGoodsNm").text(goodsNm);
		
		fn_openBasket($obj, optPhaseDiv);
	} else {
		var qty = $(".count", $obj.closest("div")).val(); 
		var goodsCd = $obj.attr("tag");
		var ctg_cd = $obj.attr("ctg_cd");
		
		// 메인 장바구니 구매수량 제한용
		var data = {'goodsCd':goodsCd,'ctg_cd':ctg_cd};
		var limitDiv = fn_getBuyLimitDivInfo(data);
		
		if(qty == 0) {  
			alert("선택된 상품이 없습니다.");
	 		return;
		}
		
		if (qty === undefined) {
			qty = 1;
		}
		// 메인 장바구니 구매수량 제한용
		if( limitDiv != null ){
			if( limitDiv.buyLimitDiv == '1002' || limitDiv.buyLimitDiv == '1003'){
				if( qty < limitDiv.minBuyQty ){
					alert("최소 "+limitDiv.minBuyQty+"개 부터 구매가능합니다.");
					return false;
				}
				if( qty > limitDiv.maxBuyQty ){
					alert("구매 가능 수량을 초과하였습니다.");
					return false;
				}
				
			}
		}
		
		var param = {
			goodsCd 	 	 : goodsCd
			,dispCtg 		 : ctg_cd
			,qty     		 : qty 
		}
		
		$.ajax({
			url : "/onnuri/main/validChkForBasket"
			, dataType : "json" 
			, data : param 
			, global : false   
			, success : function(data){
				console.log(data);
				var resultSuccessMsg = data.resultSuccessMsg;
				if(data.resultMsg != "") { 
					alert(data.resultMsg);
					return;
				} else {
					var optionList = [];
					
					optionList.push(param);
					
					var data = JSON.stringify(
						optionList
					);
					
					fn_insertOrderBasket(data, function() {
						if(confirm(resultSuccessMsg)){
							location.href = "/onnuri/order/basket/list";
						} 
					}); 
				}
			}
		});
	}
}

/* 파일 업로드 확장자 체크 */
function gfn_imageFileCheck(obj) {
	if ($(obj).val() != "") {
		var ext = $(obj).val().split('.').pop().toLowerCase();
		if ($.inArray(ext, ['gif','png','jpg','jpeg','bmp']) == -1) {
			alert("이미지파일만 등록 가능합니다.\n확장자 : GIF, PNG, JPG, JPEG, BMP");
			$(obj).val("");
			return;
		}
	}
}

//이메일 체크 정규식
function gfn_emailFormatKeyUp($obj) {
	var text = $obj.val();
	text = text.replace(/[^a-z|A-Z|[0-9]|_|-|\.]/g,'');
	$obj.val(text);
}

//사람이름 
function gfn_humanNameFormatKeyUp($obj) {
	var text = $obj.val();
	text = text.replace(/[^ㄱ-힣|a-z|A-Z]/g,'');
	$obj.val(text);
}

/**
 * 숫자 자리수 지정
 * @returns {int}
 */
function fn_intPad(n, width) {
	n = n+'';
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

$(document).on('input', '.onlyNumber', function() {
	this.value = this.value.replace(/[^0-9]/g, '');
});


// ++++++++++++++++ 출고예정일 계산 + 희망배송일 ++++++++++++++++++++++++++

//배송예정일
function fn_delivery(param){

	//요일 구하기
	var week = new Array('일','월','화','수','목','금','토');
	var today = new Date(); // 날자 변수 선언
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var hours = today.getHours();
    var minutes = today.getMinutes();
    var day = today.getDate();
//     var dayName = week[today.getDay()];

    // DB 조회 데이터들 
	var outOrderEndTm		= param.outOrderEndTm;			// 출고주문마감시간
	var outReadyDiv 		= param.outReadyDiv;			// 출고준비기간구분  0:출고제한없음, 1:당일, 2(2일) ~ 10(10일 이내)
	var outWdayDiv 			= param.outWdayDiv;				// 출고요일[]제한구분  1(월),2(화),3(수),4(목),5(금),6(토),7(일) -> 요일 체크
	var outWdayDivArr 		= outWdayDiv!=null?outWdayDiv.split(","):[];
	var outHolidayYn 		= param.outHolidayYn;			// 출고제한휴무일적용여부
	var dlvrSysType 		= param.dlvrSysType; 			//발송배송 정책 ( 새벽배송 판별을 위함 !! 1002: 새벽배송 ) => 백오피스에 새벽배송에 대한 설정이 없어서 정책값으로 체크함
	var cspCd 				= param.cspCd;					// CspCd ::: csp캘린더 휴무일 조회를 위함
	var orderStartTm 		= param.orderStartTm;			// 새벽배송 주문 가능 시작시간
	var orderEndTm 	 		= param.orderEndTm;				// 새벽배송 주문 가능 끝 시간
	var hopeDlvrWdayDiv		= param.hopeDlvrWdayDiv;		// 희망배송일 제한요일
	var hopeWdayDivArr		= hopeDlvrWdayDiv.split(",");	// 제한요일 배열
	var hopeDlvrHolidayYn	= param.hopeDlvrHolidayYn;		// 희망배송 휴무일 적용여부
	var limitList   		= param.limitList;				// 희망배송일 제한기간
	var limitDayList		= param.limitDayList;			// 희망배송 휴무일 적용시 제한할 일자들
	var hopeDlvrReadyDiv	= param.hopeDlvrReadyDiv;		// 희망배송 준비기간
	var hopeDlvrTmDiv		= param.hopeDlvrTmDiv;			// 희망배송시간설정 ( 셀렉트박스 옵션용 )
	var bndlDlvrYn			= param.bndlDlvrYn;				// 묶음배송여부
	
	
	var outWdayDivMap 		= {};
	var toDayDeliveryFlag 	= 0;							//당일배송 구분
		
	
	var isTimeOver = false;
    var hh = Number(outOrderEndTm.substring(0,2));
	var mm = Number(outOrderEndTm.substring(2,4));
	var currentTime = (hours * 60) + minutes;
	var outOrderTime = (hh * 60) + mm;
	var deliveryText = "";
	
	
	if( dlvrSysType == '1002'){
		// ++++  배송정책이 새벽배송인 경우
		deliveryText = orderStartTm+'시 ~ '+ orderEndTm+"시 사이 주문 시,   새벽배송 예정";
		
	}else{
		
		// ++++  출고일 기준인 경우 
		
		//현재시간이 출고주문마감시간을 넘었는지 체크
        if(currentTime > outOrderTime){
        	isTimeOver = true;
        }

		//당일이 아닌경우 준비기간을 오늘날짜에 플러스 해준다.
		if(outReadyDiv > 1){
			today.setDate(today.getDate() + outReadyDiv);
		}else{
			//당일인경우
			toDayDeliveryFlag = 1;
		}

		//출고요일제한구분을 array에 셋팅
		var outWdayArr = [];
		for(var i=0; i<outWdayDivArr.length; i++) {
			// outWdayDivMap[outWdayDivArr[i] + ""] = 'Y';
			var wdayNum = -1;
			try {
				wdayNum = Number(outWdayDivArr[i]);
				if( wdayNum == 7 ) wdayNum = 0;	// 일요일처리
				
				outWdayArr.push(wdayNum);
			}
			catch(errorIgnored) {
				// 에러 무시
			}
		}

		var key = today.getDay() + toDayDeliveryFlag;
		var cnt = 0;

		//0:출고제한없음, 1:당일
		if(outReadyDiv == 0 || outReadyDiv == 1){

			//오늘배송인데 현재시간이 넘었을때는 여기
			if(isTimeOver){
				today.setDate(today.getDate() + 1);
				
				// 휴일 적용 시
				if(outHolidayYn == 'Y'){
					
					var holiday = '';
					// csp 휴일 세팅 + 공통 휴일까지 계산 
					holiday = fn_getHolidayMax(today,cspCd);
					
					if( holiday != '') {
						var yyyy = holiday.substr(0,4);
				        var mm = Number(holiday.substr(4,2)) -1;
				        var dd = holiday.substr(6,2);   
				        today = new Date(yyyy,mm,dd);
					}
					
				}
				
				deliveryText = today.getMonth()+1 + "/" + today.getDate() + " 출발예정";
			}else{
				var holidayCheckYn = 'N';
				// 휴일 적용 시
				if(outHolidayYn == 'Y'){
					
					var holiday = '';
					// csp 휴일 세팅 + 공통 휴일까지 계산 
					holiday = fn_getHolidayMax(today,cspCd);
					if( holiday != '') {
						var checkMonth = month;
						var checkDay = day;
						if (month < 10 ) {
							checkMonth = "0"+ month;
						}
						if (day < 10 ) {
							checkDay = "0"+ day;
						}
						var checkToDay = today.getFullYear() + checkMonth + checkDay;
						if (holiday != checkToDay) {
							holidayCheckYn = 'Y';
						}
						var yyyy = holiday.substr(0,4);
						var mm = Number(holiday.substr(4,2)) -1;
						var dd = holiday.substr(6,2);
						today = new Date(yyyy,mm,dd);
					}
				}
				if (holidayCheckYn == 'Y') {
					deliveryText = today.getMonth()+1 + "/" + today.getDate() + " 출발예정";
				} else {
					var endTm = outOrderEndTm.substring(0,2) +"시 "+outOrderEndTm.substring(2,4)+"분";
					deliveryText = endTm+" 이전 주문 시,  오늘 출발예정";
				}
			}

		}else{
		
			today.setDate(today.getDate() + cnt);
			// 휴일 적용 시
			if(outHolidayYn == 'Y'){
				
				var holiday = '';
				// csp 휴일 세팅 + 공통 휴일까지 계산 
				holiday = fn_getHolidayMax(today,cspCd);
				
				if( holiday != '') {
					var yyyy = holiday.substr(0,4);
			        var mm = Number(holiday.substr(4,2)) -1;
			        var dd = holiday.substr(6,2);   
			        today = new Date(yyyy,mm,dd);
				}
				
			}
			deliveryText = today.getMonth()+1 + "/" + today.getDate() + " 출발예정";
		}
		
		var dlvrDate = new Date(today);
		var isOutWdayDiv = false;
		// dlvrDate.setDate(dlvrDate.getDate() + toDayDeliveryFlag);
		for(var i=0; i<7; i++) {
			if( $.inArray(dlvrDate.getDay(), outWdayArr) > -1 ) {
				dlvrDate.setDate(dlvrDate.getDate() + 1);
				isOutWdayDiv = true;
			}
			else {
				break;
			}
		}
		
		if( isOutWdayDiv ) {
			
			// 휴일 적용 시
			if(outHolidayYn == 'Y'){
				
				var holiday = '';
				// csp 휴일 세팅 + 공통 휴일까지 계산 
				holiday = fn_getHolidayMax(dlvrDate,cspCd);
				
				if( holiday != '') {
					var yyyy = holiday.substr(0,4);
			        var mm = Number(holiday.substr(4,2)) -1;
			        var dd = holiday.substr(6,2);   
			        dlvrDate = new Date(yyyy,mm,dd);
				}
				
			}		
			deliveryText = dlvrDate.getMonth()+1 + "/" + dlvrDate.getDate() + " 출발예정";
		}
	}
	
	// 당일 + 새벽 배송일때 
	if( gfn_isEmpty (dlvrDate) ){
		// 오늘날짜 
		dlvrDate = today;
	}
	
	
	//+++++ 희망배송일 데이터피커 세팅 !! : 합쳐보았음..+++++
	
//	if(bndlDlvrYn) 묶음배송여부 추가할것임
	
	
	// 시간 셀렉트박스 세팅용 
	setDateOption(hopeDlvrTmDiv); 
	// 출고 가능날짜 + 희망배송 준비기간 일자 플러스용 
	dlvrDate.setDate(dlvrDate.getDate() + Number(hopeDlvrReadyDiv));
	
	var option = {};
	option.minDate = dlvrDate; 
	
	option.beforeShowDay = function(date) {
		
		
		var day = date.getDay();	// 요일
		var dateRange = [];			// 제한할 일자 + 기간 일자
		
		// 일자별 선택 제한
		for(var i=0; i<hopeWdayDivArr.length; i++){
			
		    if( Number(hopeWdayDivArr[i]) == 7 ){
		    	hopeWdayDivArr[i] == 0;
		    	// 백오피스에서 일요일의 값을 7로 지정했음, 데이터 객체에 맞춰 0으로 변환 
		    }
		    // 희망배송 요일 제외용
		    if(Number(hopeWdayDivArr[i]) == day ) {
		    	return [false];
   	        }
   	    }
        
//			// 희망배송 휴무일 적용용
			if( hopeDlvrHolidayYn == 'Y' ){ // 희망배송제한 시 휴무일 적용 조회 리스트 가져와서 적용 필요 
				for (i = 0; i < limitDayList.length; i++) {
					dateRange.push(limitDayList[i].GEN_DATE);
			    }
				// 주말제외용...
				if( day == 0 || day == 6 ){
					return [false];								
				}
			}
		 
			
			//+++++++++++++++++++++++++++++++++++++++++//
			// 배열에 있는 0번째부터 +  시작일 ~ 종료일 전부 담을 배열         
			if( limitList.length > 0 ){
				for(var i = 0; i <limitList.length; i++ ){
					////////////////////////////////////////////////////////////
					// 방어코딩 :: limitList가 yyyyMMdd 가 아닌 경우 하기 로직 실행암함.
					////////////////////////////////////////////////////////////
					if(!gfn_isEmpty(limitList[i].START_MMDD) && !gfn_isEmpty(limitList[i].END_MMDD)){
						if(limitList[i].START_MMDD.length == 8 && limitList[i].END_MMDD.length == 8 ){
							// 임시용 ++++++ 년월일 컬럼 변경되면 getfullYear 변경 해야함 지금은 임시로 월일만 짜름 기존이 월일만 받음 
							sDay = new Date( Number(limitList[i].START_MMDD.substr(0, 4)), 	Number(limitList[i].START_MMDD.substr(4,2)) -1, 	Number(limitList[i].START_MMDD.substr(6,2))	);
							eDay = new Date( Number(limitList[i].END_MMDD.substr(0, 4)), 	Number(limitList[i].END_MMDD.substr(4,2)) -1, 		Number(limitList[i].END_MMDD.substr(6,2))	);
							for(var d = sDay; d <= eDay; d.setDate(d.getDate() + 1)){
							    // 전부 담아서 포맷!
								dateRange.push($.datepicker.formatDate('yymmdd',d));
							}
						}
					}
				}
			}
			var dateString = jQuery.datepicker.formatDate('yymmdd',date);
			return [dateRange.indexOf(dateString) == -1];
	   	   
 		return [true];
		
	}
	// 상품상세 출고일자 표시하기 위해 리턴함/...
	option.deliveryText = deliveryText;
	
	return option;
}

function fn_getHolidayMax(date,cspCd){

    var toYear      = date.getFullYear();
    var toMonth		= (date.getMonth()+1)>9 ? ''+(date.getMonth()+1) : '0'+(date.getMonth()+1);
    var toDay      	= date.getDate()>9 		? ''+(date.getDate())	 : '0'+(date.getDate());
    var toDate   	= ""+toYear+ toMonth + toDay;
    
    date.setMonth(date.getMonth()+4);
    var fromYear    = date.getFullYear();
    var fromMonth	= (date.getMonth()+1)>9 ? ''+(date.getMonth()+1) : '0'+(date.getMonth()+1);
    var fromDay     = date.getDate()>9 		? ''+(date.getDate())	 : '0'+(date.getDate());
    var fromDate 	= ""+fromYear+ fromMonth + fromDay;
	
    var holiday = fn_getHoliday(toDate,fromDate,cspCd);
    return holiday;
}

//CSP 휴일 + 공통 휴일 계산 쿼리 
function fn_getHoliday(date,fromDate,cspCd) {
	var retrunDate = "";

	$.ajax({
		url : "/onnuri/goods/selectHoliday"
		, dataType : "json" /* html, json */
		, contentType: "application/json"
		, data : {"cspCd" : cspCd, "date": date, "fromDate" : fromDate}
		, async : false
     	, success : function(data){

     		if( data.date != null) {
     			retrunDate = data.date.RDATE;
     		}
     	}

	});

	return retrunDate;
}

//희망배송일 시간, 분 선택 셀렉트박스 세팅
function setDateOption(hopeDlvrTmDiv) {
	
	var hopeDlvrTmDiv 	= hopeDlvrTmDiv; // 구별값
	var hopeOptHh 		= ''; // 시간 셀렉트박스 옵션
	var hopeOptMm 		= ''; // 분 셀렉트박스 옵션
	var roofHopeT 		= 21; //  희망 시간 루프용 
	
	// 화면에서만 안보이게 처리함.:: 20201023 1838 :: show
	$('#hopeTt').parent().show();
	$('#hopeMm').parent().show();
	$('#hopeTt').html("");
	$('#hopeMm').html("");
	
	// ++++++++ 시작과 끝시간을 09 ~ 20 시로 고정 했음 +++++++++++++++
	if( hopeDlvrTmDiv == '1001' ){ 	     // 오전/오후
					
		hopeOptHh += '<option value="09">오전 : 09 ~ 12시</option>';
		hopeOptHh += '<option value="13">오후 : 13 ~ 20시</option>';
		$('#hopeTt').append(hopeOptHh);
		
//		hopeOptMm = '<option value="00">00분</option>';
//		$('#hopeMm').append(hopeOptMm);
		$('#hopeMm').parent().hide();
		
	}else if ( hopeDlvrTmDiv == '1002' ){ // 30분 단위
		
		for(var i=9; i < roofHopeT; i++ ){
			var time = i < 10 ? '0'+i : i ; 
			hopeOptHh += '<option value="'+time+'">'+time+'시</option>';
		}
		$('#hopeTt').append(hopeOptHh);
		
		hopeOptMm += '<option value="00">00분</option>';
		hopeOptMm += '<option value="30">30분</option>';
		$('#hopeMm').append(hopeOptMm);
		
		
	}else if ( hopeDlvrTmDiv == '1003'){  // 1시간 단위
		
		
		for(var i=9; i < roofHopeT; i++ ){
			var time = i < 10 ? '0'+i : i; 
			hopeOptHh += '<option value="'+time+'">'+time+'시</option>';
		}
		$('#hopeTt').append(hopeOptHh);
		
//		hopeOptMm = '<option value="00">00분</option>';
//		$('#hopeMm').append(hopeOptMm);
		$('#hopeMm').parent().hide();
		
	}else if( hopeDlvrTmDiv == '1004' ){								 // 2시간 단위
		
		for(var i=9; i < roofHopeT; i++ ){
			var time = i < 10 ? '0'+i : i; 
			hopeOptHh += '<option value="'+time+'">'+time+'시</option>';
			i++;
		}
		$('#hopeTt').append(hopeOptHh);
		
//		hopeOptMm = '<option value="00">00분</option>';
//		$('#hopeMm').append(hopeOptMm);
		$('#hopeMm').parent().hide();
	}else{
		// TODO :: 화면에서만 안보이게 처리함.:: 20201023 1838 :: remove => hide
		$('#hopeTt').parent().hide();
		$('#hopeMm').parent().hide();
	}
}

function incodeFile(file , removeFiles) {

	// 이미지 확장자 체크
	gfn_imageFileCheck(file);
	// 공통 함수가 리턴값이 알러트 + 밸류 비워줘서 값 체크해서 유효성 적용
	if(gfn_isEmpty($(file).val())){
		return false;
	}
	
	var fileName = file[0].files[0].name;	// 파일원본명 
	var attrId 	 = file.attr("id");		    // 파일구별용 (삭제시 배열에서 제거하기 위함)
	var fileSize;							// 파일사이즈
	
	var parent 	 = file.parent();
	
	if(window.FileReader){
		//image 파일만
		if (!file[0].files[0].type.match(/image\//)) return;

		var reader = new FileReader();
		reader.onload = function(e){
			var src = e.target.result;
			
			if( navigator.appName == "Microsoft Internet Explorer"){	// 익스플로러일 경우
				var oas = new ActiveXObject("Scripting.FileSystemObject");
				fileSize = oas.getFile( file.value ).size;
			}else{
				fileSize = file[0].files[0].size;
			}

			var dataIndex = src.indexOf(',') + 1;
            var base64 = src.substring(dataIndex,reader.result.length);
            var org = file.closest('.preview_image').data();
            var orgSrc = file.closest('.preview_image').find(".upload-thumb").attr("src");
            file.closest('.preview_image').data("fileSize", fileSize);
            
        	// 파일사이즈 합계 2MB 유효성 체크필요 
        	if( fileChkSize() == true){
                file.closest('.preview_image').data("isServerData", "N");
                file.closest('.preview_image').data("file", base64);
                file.closest('.preview_image').data("fileName", fileName);
                file.closest('.preview_image').data("attrId", attrId);
                file.closest('.preview_image').data("fileSize", fileSize);

                file.closest('.preview_image').data("preFile", file[0].files[0]);
                
                if(typeof org.key !== 'undefined' && org.key != ''){
                	var addFileObj = { 'strBasketNum' : org.key.split("|")[0]
										, 'strBasketFileNum' : org.key.split("|")[1]
					}
					removeFiles.push(addFileObj);
                }
        		parent.children('.upload-display').remove();
        		file.closest('.preview_image').addClass('on');
    			parent.prepend('<div class="upload-display"><div class="upload-thumb-wrap"><img src="'+src+'" class="upload-thumb"></div></div>');
        	}else{
                // 이전데이터 복구
                if(typeof org.key !== 'undefined' && org.key != ''){
                	file.closest('.preview_image').data("key", org.key);
                    file.closest('.preview_image').data("fileSize", 	org.fileSize)
            		file.closest('.preview_image').addClass('on');
                }else{
	                file.closest('.preview_image').data("file", 		org.file);
	                file.closest('.preview_image').data("fileName", 	org.fileName);
	                file.closest('.preview_image').data("attrId", 		org.attrId);
	                file.closest('.preview_image').data("fileSize", 	org.fileSize)
                }
        	}
		}
		reader.readAsDataURL(file[0].files[0]);
	}
}
function fn_DeleteFile(obj, removeFiles ){
	var $this = obj;
	
	if(typeof $this.closest('.preview_image').data("key") !== 'undefined'){
        var addFileObj = {	'strBasketNum' : $this.closest('.preview_image').data("key").split("|")[0]
        					, 'strBasketFileNum' : $this.closest('.preview_image').data("key").split("|")[1]
        }
		removeFiles.push(addFileObj);
		$this.closest('.preview_image').removeAttr("data-key");
		$this.closest('.preview_image').removeAttr("data-file-size");
		
		$this.closest('.preview_image').removeData("key");
		$this.closest('.preview_image').removeData("file");
		$this.closest('.preview_image').removeData("fileName");
		$this.closest('.preview_image').removeData("attrId");
		$this.closest('.preview_image').removeData("fileSize");
	}
	$this.closest('.preview_image').removeClass('on');
} 


function fileChkSize() {
	
	var maxSize = 2 * 1024 * 1024;			// 2MB
	var fileListSum = 0;					// 파일리스트 사이즈 SUM
	
	$("[addInfoFilelist]").find(".preview_image").each(function(){
		if(typeof $(this).data("fileSize") !== 'undefined'){
			fileListSum += Number($(this).data("fileSize"));	
		}
	});
	console.log("["+fileListSum+"]");
	if(fileListSum > maxSize) {
	   alert("첨부파일 사이즈는 2MB 이내로 등록 가능합니다.");
	   return false;
	}
	return true;
   
}


var findAttrId = function(_list, _t){
	var ret = false;
    if(_list.length > 0 ){
		for(i=0; i<_list.length; i++){
			if( _list[i].attrId == _t ){
				ret = true;
			}
		}
	}
    return ret;
};

function getSubImage(a,b) {
	
	var c = $('#'+b);
	
    if(window.FileReader){
        //image 파일만
        
        var reader = new FileReader();
        reader.onload = function(e){
            var src = e.target.result;
            c.closest('.preview_image').removeClass("off").addClass('on');
            c.parent().prepend('<div class="upload-display"><div class="upload-thumb-wrap"><img src="'+src+'" class="upload-thumb"></div></div>');
        }
        reader.readAsDataURL(a);
    }
}

function fn_DeleteFileForDtl(removeFile){
	
     // 삭제버튼 값으로 id 비교 !
	 var id = $(removeFile).data('delTarget')
     
     // 저장된 정보가 아닐때 배열에서 삭제하기 위함 
     if(typeof comm.addInfo[comm.addInfo.currInfo["id"]] !== 'undefined' && comm.addInfo[comm.addInfo.currInfo["id"]].addFiles.length > 0){
       
    	   var fileList = comm.addInfo[comm.addInfo.currInfo["id"]].addFiles;
       
           for(i=0; i<fileList.length; i++){
             
	             if( fileList[i].attrid == id ){
	               fileList.splice(i, 1);
	      
	             }
           }
     }
     $('#'+id).val('');
     $(removeFile).closest('.preview_image').removeClass('on');
}

/**
 * 특정 문자 전체 바꾸기 함수
 */
function gfn_ReplaceAll(str, searchStr, replaceStr) {
	try{
		return str.split(searchStr).join(replaceStr);
	}
	catch(ex) {
		return str;
	}
}


function chkAccessYn(ctgCd, callback) {
	
	
	$.ajax({
		url : "/onnuri/common/chkAccessYn"
		, dataType : "json" /* html, json */
		, contentType: "application/json"
		, data : {"ctgCd" : ctgCd}
		, async : false
     	, success : function(data){
     		var data = data.result;
     		callback(data);
     	}
	});
	
}
 
function fn_getBuyLimitDivInfo(data) {
	
	var returnData = {};
	
	$.ajax({
		url : "/onnuri/common/getBuyLimitDivInfo"
		, dataType : "json" /* html, json */
		, contentType: "application/json"
		, data : data
		, async : false
     	, success : function(data){
     		returnData = data.result;
     	}
	});
	
	return returnData;
}

if (!Array.prototype.every) {
	  Array.prototype.every = function(callbackfn, thisArg) {
	    'use strict';
	    var T, k;

	    if (this == null) {
	      throw new TypeError('this is null or not defined');
	    }

	    // 1. Let O be the result of calling ToObject passing the this
	    //    value as the argument.
	    var O = Object(this);

	    // 2. Let lenValue be the result of calling the Get internal method
	    //    of O with the argument "length".
	    // 3. Let len be ToUint32(lenValue).
	    var len = O.length >>> 0;

	    // 4. If IsCallable(callbackfn) is false, throw a TypeError exception.
	    if (typeof callbackfn !== 'function') {
	      throw new TypeError();
	    }

	    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
	    if (arguments.length > 1) {
	      T = thisArg;
	    }

	    // 6. Let k be 0.
	    k = 0;

	    // 7. Repeat, while k < len
	    while (k < len) {

	      var kValue;

	      // a. Let Pk be ToString(k).
	      //   This is implicit for LHS operands of the in operator
	      // b. Let kPresent be the result of calling the HasProperty internal
	      //    method of O with argument Pk.
	      //   This step can be combined with c
	      // c. If kPresent is true, then
	      if (k in O) {

	        // i. Let kValue be the result of calling the Get internal method
	        //    of O with argument Pk.
	        kValue = O[k];

	        // ii. Let testResult be the result of calling the Call internal method
	        //     of callbackfn with T as the this value and argument list
	        //     containing kValue, k, and O.
	        var testResult = callbackfn.call(T, kValue, k, O);

	        // iii. If ToBoolean(testResult) is false, return false.
	        if (!testResult) {
	          return false;
	        }
	      }
	      k++;
	    }
	    return true;
	  };
	}

/*
 * 
 * 회원가입 시 비밀번호 검증 시 각 validation 마다 alert창을 띄어주기 위함
 * 
 */

function gfn_pwReg2(password, str, type){
	var aa = 0;
    var regEx1 = /[0-9]/gi;
    var regEx4 = /[-/:;()\&@.,?!\[\]{}#%^*+=_|~$]/gi;
    var errorMsg = '';
    
    if(regEx1.exec(password)) {
        aa++;
    }
    if(password.toLowerCase() != password) {
        aa++;
    }
    if(password.toUpperCase() != password) {
        aa++;
    }
    if(regEx4.exec(password)) {
        aa++;
    }
    if(aa >= 2 && (password.length >= 8 && password.length <= 16)){
    	if (/(\w)\1\1/.test(password)) { // 동일한 문자 3회 이상
    		errorMsg = '3자리 이상 연속된 문자/숫자는 사용할 수 없습니다.'; 
    	}
    	if (!gfn_checkContinue(password, 3)) { // 연속된 숫자 3회 이상
    		errorMsg = '3자리 이상 연속된 문자/숫자는 사용할 수 없습니다.';
        }
    	
    	if (str != undefined && password.search(str) > -1) { // 개인정보 사용 불가
    		if(type && type == 'id') {
    			errorMsg = '비밀번호는 아이디와 동일하게 사용할 수 없습니다.';
    		}
    		
    		if(type && type == 'birth') {
    			errorMsg = '생년월일은 사용할 수 없습니다.';
    		}
    		
    		if(type && type == 'phone') {
    			errorMsg = '핸드폰 번호 뒤 4자리는 사용할 수 없습니다.';
    		}
    	}
    }
    
    return errorMsg;
}
/**
 * 현재 일자 ()
 * return yyyymmdd
 */

function getToday(){
	var date = new Date();
	var year = date.getFullYear();
	var month = ("0" + (1 + date.getMonth())).slice(-2);
	var day = ("0" + date.getDate()).slice(-2);

	return year + month + day;
}