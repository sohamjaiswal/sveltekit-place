export class PhotoBox {
    static getUserAvatar(id: string) {
      return `https://photobox.cardboard.ink/user/avatar/${id}`;
    }
    static getUserBanner(id: string) {
      return `https://photobox.cardboard.ink/user/banner/${id}`;
    }
}