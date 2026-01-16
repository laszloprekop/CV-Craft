import 'styled-components'
import { Theme } from './themes/defaultTheme'

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
