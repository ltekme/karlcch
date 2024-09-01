import xml.etree.ElementTree as ET


class UrlElement(ET.Element):
    def __init__(self, loc: str, lastmod: str, changefreq: str = None):
        super().__init__('url')
        self.loc = loc
        self.lastmod = lastmod
        self.changefreq = changefreq

        ET.SubElement(self, 'loc').text = self.loc
        ET.SubElement(self, 'lastmod').text = lastmod
        if changefreq is not None:
            ET.SubElement(self, 'changefreq').text = changefreq
