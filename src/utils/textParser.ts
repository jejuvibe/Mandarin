import { ParsedOrderData } from '../types';

/**
 * Smart Korean Order Message Parser
 * Automatically identifies recipient name, mobile phone number, address,
 * postal code, delivery request/memo, and citrus quantities (5kg, 10kg)
 * from freeform text messages, KakaoTalk chats, or bank notices.
 */

const KOREAN_REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

const NON_NAME_WORDS = new Set([
  '감귤', '밀감', '귤', '노지', '타이벡', '하우스', '천혜향', '한라봉', '레드향',
  '과일', '농원', '농장', '직거래', '주문', '신청', '접수', '입금', '송금',
  '완료', '확인', '계좌', '농협', '국민', '신한', '우리', '하나', '기업',
  '카카오', '토스', '택배', '배송', '발송', '요청', '수량', '박스', '상자',
  '키로', '킬로', '선물', '가정용', '파지', '특상품', '원', '전화', '주소',
  '성함', '이름', '받는분', '보내는분', '수령인', '도착', '배송지', '우편',
  '제주도', '서귀포', '제주시', '문앞', '경비실', '부탁', '연락',
  '아파트', '빌라', '푸르지오', '자이', '래미안', '힐스테이트', '더샵', '아이파크',
  '롯데캐슬', 'e편한세상', '호반', '포레나', '중흥', '센트럴', '타워', '맨션',
  '마을', '단지', '오피스텔', '원룸', '하이츠', '주택', '신도시'
]);

export function parseKoreanOrderMessage(rawText: string): ParsedOrderData {
  if (!rawText || !rawText.trim()) {
    return {};
  }

  const result: ParsedOrderData = {};
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let remainingText = rawText;

  // 1. Extract Mobile Phone Number (010-XXXX-XXXX, 010xxxxxxxx, 011, etc.)
  const phoneRegex = /(?:01[016789]|02|0[3-6][1-5])[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  const phoneMatches = rawText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    const rawPhone = phoneMatches[0];
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length === 11) {
      result.phone = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
    } else if (digitsOnly.length === 10) {
      if (digitsOnly.startsWith('02')) {
        result.phone = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
      } else {
        result.phone = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      }
    } else {
      result.phone = rawPhone.trim();
    }
    remainingText = remainingText.replace(rawPhone, ' ');
  }

  // 2. Extract 5-digit Postal Code (e.g. [10070], (10070), 우편번호: 10070, 우편: 10070, 우) 10070)
  // Note: Optional, not mandatory
  const bracketedOrLabeledPostalRegex = /(?:우편번호|우편|우\s*[.)]?|zip\s*code)\s*[:：]?\s*[\[\(]?\s*(\d{5})\s*[\]\)]?|[\[\(](\d{5})[\]\)]/i;
  const postalMatch = rawText.match(bracketedOrLabeledPostalRegex);
  if (postalMatch) {
    result.postalCode = postalMatch[1] || postalMatch[2];
    remainingText = remainingText.replace(postalMatch[0], ' ');
  }

  // 3. Extract Citrus Quantities (10kg, 5kg)
  const regex10kg = /(?:10\s*(?:kg|kilo|키로|킬로))\s*[:=]?\s*(\d+)?\s*(?:박스|상자|개|EA)?/i;
  const match10 = rawText.match(regex10kg);
  if (match10) {
    result.detected10kg = match10[1] ? parseInt(match10[1], 10) : 1;
    remainingText = remainingText.replace(match10[0], ' ');
  }

  const regex5kg = /(?:5\s*(?:kg|kilo|키로|킬로))\s*[:=]?\s*(\d+)?\s*(?:박스|상자|개|EA)?/i;
  const match5 = rawText.match(regex5kg);
  if (match5) {
    result.detected5kg = match5[1] ? parseInt(match5[1], 10) : 1;
    remainingText = remainingText.replace(match5[0], ' ');
  }

  // 4. Extract Explicitly Labeled Delivery Memo / Request
  // (e.g. 배송요청: 문앞에 놔주세요, 요청사항:, 배송메모:)
  const labeledMemoRegex = /(?:배송\s*요청\s*(?:사항)?|배송\s*메모|요청\s*사항|전달\s*사항|배송\s*주의사항|메모|비고)\s*[:：]\s*([^\r\n]+)/i;
  const labeledMemoMatch = rawText.match(labeledMemoRegex);
  if (labeledMemoMatch) {
    result.memo = labeledMemoMatch[1].trim();
    remainingText = remainingText.replace(labeledMemoMatch[0], ' ');
  }

  // 5. Extract Explicitly Labeled Name
  const labeledNameRegex = /(?:이름|성함|받는\s*분|수령인|주문자|받는\s*사람|고객명)\s*[:：]\s*([가-힣a-zA-Z\s]{2,10})/i;
  const labeledNameMatch = rawText.match(labeledNameRegex);
  if (labeledNameMatch) {
    result.customerName = labeledNameMatch[1].trim();
    remainingText = remainingText.replace(labeledNameMatch[0], ' ');
  }

  // 6. Extract Address (Whole address string without premature cut-off)
  let rawDetectedAddress = '';

  // Check labeled address line first: 주소:, 배송지:, 배송주소:
  for (const line of lines) {
    const labelMatch = line.match(/^(?:주소|배송지|배송주소|수령주소|주소지)\s*[:：]\s*(.+)$/i);
    if (labelMatch) {
      rawDetectedAddress = labelMatch[1].trim();
      remainingText = remainingText.replace(line, ' ');
      break;
    }
  }

  // Fallback: If not labeled, detect whole line containing Korean address components
  if (!rawDetectedAddress) {
    for (const line of lines) {
      const strippedLine = line
        .replace(phoneRegex, '')
        .replace(/(?:우편번호\s*[:：]?\s*|[\[\(])?\d{5}[\]\)]?/g, '')
        .trim();

      const hasRegion = KOREAN_REGIONS.some(
        (region) =>
          strippedLine.startsWith(region) ||
          strippedLine.includes(`${region}시`) ||
          strippedLine.includes(`${region}도`)
      );
      const hasRoadOrJibeon = /(?:시|군|구|읍|면|동|리|로|길|대로)\b/.test(strippedLine);
      const hasBuildingOrApartment = /\d+[-~]\d+|\d+번지|\d+동|\d+호|아파트|빌라|마을|맨션|타워|주택|층/.test(strippedLine);

      if ((hasRegion && (hasRoadOrJibeon || hasBuildingOrApartment)) || (hasRoadOrJibeon && hasBuildingOrApartment)) {
        rawDetectedAddress = line;
        remainingText = remainingText.replace(line, ' ');
        break;
      }
    }
  }

  // Fallback: Look inside remaining text for address block if still not found
  if (!rawDetectedAddress) {
    const regionPattern = `(?:${KOREAN_REGIONS.join('|')})(?:특별시|광역시|특별자치시|도|시)?\\s+[가-힣0-9\\s,.-]+?(?:동|로|길|대로|번지|리|읍|면)(?:\\s+[가-힣0-9\\s()동호층빌라아파트맨션,.-]+)?`;
    const regionRegex = new RegExp(regionPattern, 'i');
    const broadMatch = remainingText.match(regionRegex);
    if (broadMatch) {
      rawDetectedAddress = broadMatch[0];
      remainingText = remainingText.replace(broadMatch[0], ' ');
    }
  }

  // Clean Address & Separate Delivery Request / Postal Code from Address
  if (rawDetectedAddress) {
    const { address, extractedMemo, extractedPostalCode } = cleanAddressAndExtractMeta(rawDetectedAddress);
    result.address = address;

    if (!result.postalCode && extractedPostalCode) {
      result.postalCode = extractedPostalCode;
    }

    if (!result.memo && extractedMemo) {
      result.memo = extractedMemo;
    }

    if (address) {
      remainingText = remainingText.replace(address, ' ');
    }
  }

  // 7. If Name Not Found by Label, detect from Remaining Text
  if (!result.customerName) {
    const cleanedLines = remainingText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of cleanedLines) {
      const nameCandidate = line.replace(/님|고객|귀하/g, '').trim();
      if (/^[가-힣]{2,4}$/.test(nameCandidate) && !NON_NAME_WORDS.has(nameCandidate)) {
        result.customerName = nameCandidate;
        break;
      }
    }

    if (!result.customerName) {
      const words = remainingText
        .split(/[\s,;]+/)
        .map((w) => w.replace(/[^가-힣a-zA-Z]/g, '').trim())
        .filter((w) => w.length >= 2 && w.length <= 4);

      for (const word of words) {
        if (!NON_NAME_WORDS.has(word) && !KOREAN_REGIONS.includes(word)) {
          if (!/(시|군|구|읍|면|동|리|로|길|호)$/.test(word)) {
            result.customerName = word;
            break;
          }
        }
      }
    }
  }

  // 8. General memo fallback: check for common delivery requests like "문 앞", "경비실", etc.
  if (!result.memo) {
    const commonDeliveryRequests = [
      '문 앞', '문앞에', '문앞', '경비실', '경비실에', '택배함', '무인택배함',
      '부재시', '배송전 연락', '도착전 전화', '직접 전달'
    ];
    for (const req of commonDeliveryRequests) {
      if (rawText.includes(req)) {
        result.memo = `${req} 보관 요청`;
        break;
      }
    }
  }

  // 9. Final Address Polish: Ensure customerName, phone number, and quantities are NEVER left inside address
  if (result.address) {
    let cleanAddr = result.address;

    // Strip any phone number patterns from address (formatted & unformatted)
    cleanAddr = cleanAddr.replace(/01[016789]\d{7,8}/g, ' ');
    cleanAddr = cleanAddr.replace(/(?:01[016789]|02|0[3-6][1-5])[-.\s]?\d{3,4}[-.\s]?\d{4}/g, ' ');

    // Strip citrus quantity mentions from address (e.g. 10키로2박스, 10kg 1박스, 5kg 2상자, 2박스)
    cleanAddr = cleanAddr.replace(/(?:\d+)\s*(?:kg|kilo|키로|킬로)\s*[:=]?\s*(?:\d+)?\s*(?:박스|상자|개|EA)?/gi, ' ');
    cleanAddr = cleanAddr.replace(/(?:\d+)\s*(?:박스|상자)/gi, ' ');
    cleanAddr = cleanAddr.replace(/\s+/g, ' ').trim();

    // Clean honorifics from customerName
    if (result.customerName) {
      result.customerName = result.customerName
        .replace(/님|고객|귀하/g, '')
        .replace(/^[\s/|,\._~;:^\-]+|[\s/|,\._~;:^\-]+$/g, '')
        .trim();
      const escapedName = result.customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanAddr = cleanAddr.replace(new RegExp(`^[\\s/|,\._~;:^\\-]*${escapedName}(?:님|고객|귀하)?[\\s/|,\._~;:^\\-]*`, 'i'), '').trim();
      cleanAddr = cleanAddr.replace(new RegExp(`[\\s/|,\._~;:^\\-]*${escapedName}(?:님|고객|귀하)?[\\s/|,\._~;:^\\-]*$`, 'i'), '').trim();
    } else {
      // If customerName was NOT extracted yet, detect trailing 2-4 hangul word at the end of address
      const trailingWordMatch = cleanAddr.match(/[\s/|,\-]([가-힣]{2,4})(?:님|고객|귀하)?[\s/|,\._~;:^\-]*$/);
      if (trailingWordMatch) {
        const candidate = trailingWordMatch[1];
        if (!NON_NAME_WORDS.has(candidate) && !KOREAN_REGIONS.includes(candidate)) {
          if (!/(시|군|구|읍|면|동|리|로|길|호|층|차|통|반|번지|마을|단지|상가|아파트|빌라|오피스텔)$/.test(candidate)) {
            result.customerName = candidate;
            cleanAddr = cleanAddr.slice(0, trailingWordMatch.index).trim();
          }
        }
      }
    }

    // Strip any leading or trailing delimiters (e.g. /, |, ,, -, ., brackets)
    cleanAddr = cleanAddr.replace(/^[\s/|,\._~;:^\-\(\)\[\]]+|[\s/|,\._~;:^\-\(\)\[\]]+$/g, '').trim();
    cleanAddr = cleanAddr.replace(/\s+/g, ' ');

    result.address = cleanAddr;
  }

  // Calculate confidence score (0 to 100)
  let score = 0;
  if (result.customerName) score += 30;
  if (result.phone) score += 35;
  if (result.address) score += 30;
  if (result.detected5kg || result.detected10kg) score += 5;
  result.confidenceScore = score;

  return result;
}

/**
 * Cleans the address and ensures delivery requests (e.g. 배송요청, 문앞)
 * are NEVER included in the address string, and extracts leading postal code if present.
 */
function cleanAddressAndExtractMeta(addr: string): {
  address: string;
  extractedMemo?: string;
  extractedPostalCode?: string;
} {
  let cleaned = addr
    .replace(/^주소\s*[:：]?\s*/i, '')
    .replace(/^배송지\s*[:：]?\s*/i, '')
    .replace(/^배송주소\s*[:：]?\s*/i, '')
    .replace(/^수령주소\s*[:：]?\s*/i, '')
    .replace(/01[016789]\d{7,8}/g, ' ')
    .replace(/(?:01[016789]|02|0[3-6][1-5])[-.\s]?\d{3,4}[-.\s]?\d{4}/g, ' ')
    .trim();

  let extractedPostalCode: string | undefined;

  // 1. Extract and strip leading postal code if present (e.g. [10070], (10070), 10070 )
  const leadingPostalMatch = cleaned.match(/^[\[\(]?(\d{5})[\]\)]?\s*/);
  if (leadingPostalMatch) {
    extractedPostalCode = leadingPostalMatch[1];
    cleaned = cleaned.slice(leadingPostalMatch[0].length).trim();
  }

  // 2. Separate delivery request / memo from the address!
  // e.g. "경기 김포시 ... 504동 2003호 배송요청: 문앞에 놔주세요"
  // or "경기 김포시 ... 504동 2003호 (배송요청 문앞)"
  let extractedMemo: string | undefined;
  const deliveryRegex = /(?:[,\s\(\[]+)?(?:배송\s*요청\s*(?:사항)?|배송\s*메모|요청\s*사항|배송\s*시\s*요청|문\s*앞|경비실|택배함|부재\s*시|배송\s*전\s*연락|직접\s*수령)\s*[:：]?\s*([^\)\]\r\n]*)/i;
  const delMatch = cleaned.match(deliveryRegex);
  if (delMatch && delMatch.index !== undefined && delMatch.index > 5) {
    const rawReq = delMatch[0].replace(/^[,\s\(\[]+/, '').trim();
    if (rawReq) {
      extractedMemo = rawReq.replace(/^(?:배송\s*요청\s*(?:사항)?|배송\s*메모|요청\s*사항|배송\s*시\s*요청)\s*[:：]?\s*/i, '').trim();
      if (!extractedMemo) {
        extractedMemo = rawReq;
      }
    }
    cleaned = cleaned.slice(0, delMatch.index).trim();
  }

  // Remove any leading or trailing delimiters (slashes, brackets, commas, dashes, etc.)
  cleaned = cleaned.replace(/^[\s/|,\._~;:^\-\(\)\[\]]+|[\s/|,\._~;:^\-\(\)\[\]]+$/g, '').trim();

  // Normalize internal whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return { address: cleaned, extractedMemo, extractedPostalCode };
}
