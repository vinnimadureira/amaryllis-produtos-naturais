import primp
c = primp.Client(headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
r = c.get('https://lista.mercadolivre.com.br/panizza-tintura-espinheira-santa-100ml')
print(r.text[:1000])
