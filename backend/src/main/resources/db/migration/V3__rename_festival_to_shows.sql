ALTER TABLE festival RENAME TO shows;

DELETE FROM shows;

INSERT INTO shows (id, name, start_date, end_date, venue, poster_url, lineup, ticket_url, official_url) VALUES
(1, 'The Paper Lanterns 내한 공연', '2026-09-05', '2026-09-05', '올림픽공원 핸드볼경기장', 'https://picsum.photos/seed/ycc1/600/800', 'The Paper Lanterns', 'https://example.com/tickets/1', 'https://example.com/shows/1'),
(2, '정다온 단독 콘서트 〈새벽〉', '2026-09-19', '2026-09-20', '예스24 라이브홀', 'https://picsum.photos/seed/ycc2/600/800', '정다온', 'https://example.com/tickets/2', 'https://example.com/shows/2'),
(3, 'Midnight Ferry 내한 공연', '2026-10-11', '2026-10-11', '무신사 개러지', 'https://picsum.photos/seed/ycc3/600/800', 'Midnight Ferry', 'https://example.com/tickets/3', 'https://example.com/shows/3'),
(4, '해파랑 밴드 전국투어 서울', '2026-10-17', '2026-10-18', '올림픽공원 올림픽홀', 'https://picsum.photos/seed/ycc4/600/800', '해파랑 밴드, 게스트 정다온', 'https://example.com/tickets/4', 'https://example.com/shows/4'),
(5, 'Neon Harbor 내한 공연', '2026-11-07', '2026-11-07', 'KSPO DOME', 'https://picsum.photos/seed/ycc5/600/800', 'Neon Harbor', 'https://example.com/tickets/5', 'https://example.com/shows/5'),
(6, 'Glass Orchard 첫 내한', '2026-11-21', '2026-11-21', '예스24 라이브홀', 'https://picsum.photos/seed/ycc6/600/800', 'Glass Orchard', 'https://example.com/tickets/6', 'https://example.com/shows/6'),
(7, '밴드 소금창고 단독 공연', '2026-12-05', '2026-12-05', '롤링홀', 'https://picsum.photos/seed/ycc7/600/800', '소금창고', 'https://example.com/tickets/7', 'https://example.com/shows/7'),
(8, '윤시월 연말 콘서트', '2026-12-24', '2026-12-25', '세종문화회관 대극장', 'https://picsum.photos/seed/ycc8/600/800', '윤시월', 'https://example.com/tickets/8', 'https://example.com/shows/8'),
(9, 'Velvet Static 아시아 투어 서울', '2027-01-23', '2027-01-24', '고척스카이돔', 'https://picsum.photos/seed/ycc9/600/800', 'Velvet Static', 'https://example.com/tickets/9', 'https://example.com/shows/9'),
(10, '모래시계 10주년 콘서트', '2027-03-14', '2027-03-14', '올림픽공원 체조경기장', 'https://picsum.photos/seed/ycc10/600/800', '모래시계', 'https://example.com/tickets/10', 'https://example.com/shows/10');
