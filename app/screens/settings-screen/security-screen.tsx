import * as React from "react"
import { useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { Text, View } from "react-native"
import { Button, Switch } from "react-native-elements"
import EStyleSheet from "react-native-extended-stylesheet"
import RNSecureKeyStore, { ACCESSIBLE } from "react-native-secure-key-store"

import { Screen } from "../../components/screen"
import { palette } from "../../theme/palette"
import { translate } from "../../i18n"
import { authenticate, isSensorAvailable } from "../../utils/biometricAuthentication"
import { toastShow } from "../../utils/toast"
import type { ScreenType } from '../../types/screen'

const styles = EStyleSheet.create({
  container: {
    minHeight: "100%",
    backgroundColor: palette.white,
    paddingLeft: 24,
    paddingRight: 24,
  },

  settingContainer: {
    flexDirection: "row",
    borderBottomColor: palette.lightGrey,
    borderBottomWidth: 1,
  },

  textContainer: {
    marginTop: 32,
    marginRight: 40,
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 16,
    fontSize: 16,
  },

  description: {
    marginTop: 2,
    fontSize: 14,
    color: palette.darkGrey,
  },

  switch: {
    position: "absolute",
    right: 0,
    bottom: 18,
  },

  button: {
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    backgroundColor: palette.white,
  },

  buttonTitle: {
    fontSize: 16,
    color: palette.black,
    fontWeight: "normal",
  },
})

type Props = {
  route: any
  navigation: any
}

export const SecurityScreen: ScreenType = ({ route, navigation }: Props) => {
  const { mIsBiometricsEnabled, mIsPinEnabled } = route.params

  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(mIsBiometricsEnabled)
  const [isPinEnabled, setIsPinEnabled] = useState(mIsPinEnabled)

  useFocusEffect(() => {
    RNSecureKeyStore.get("isBiometricsEnabled").then(
      (res) => {
        setIsBiometricsEnabled(true)
      },
      (err) => {
        setIsBiometricsEnabled(false)
      },
    )

    RNSecureKeyStore.get("PIN").then(
      (res) => {
        setIsPinEnabled(true)
      },
      (err) => {
        setIsPinEnabled(false)
      },
    )
  })

  const onBiometricsValueChanged = (value) => {
    if (value) {
      isSensorAvailable(
        handleBiometryAvailabilitySuccess,
        handleBiometryAvailabilityFailure,
      )
    } else {
      RNSecureKeyStore.remove("isBiometricsEnabled").then(
        (res) => {
          setIsBiometricsEnabled(false)
        },
        (err) => {
          // unable to remove isBiometricsEnabled
        },
      )
    }
  }

  const handleBiometryAvailabilitySuccess = (isBiometryAvailable: Boolean) => {
    if (isBiometryAvailable) {
      authenticate(
        translate("AuthenticationScreen.setUpAuthenticationDescription"),
        handleAuthenticationSuccess,
        handleAuthenticationFailure,
      )
    } else {
      toastShow("Biometric sensor is not available.")
    }
  }

  const handleBiometryAvailabilityFailure = () => {
    toastShow(
      "Please register at least one biometric sensor in order to use biometric based authentication.",
    )
  }

  const handleAuthenticationSuccess = () => {
    RNSecureKeyStore.set("isBiometricsEnabled", "1", {
      accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
    }).then(
      (res) => {
        setIsBiometricsEnabled(true)
      },
      (err) => {
        // unable to store isBiometricsEnabled
      },
    )
  }

  const handleAuthenticationFailure = () => {}

  const onPinValueChanged = (value) => {
    if (value) {
      navigation.navigate("pin", { screenPurpose: "setPIN" })
    } else {
      RNSecureKeyStore.remove("PIN").then(
        (res) => {
          RNSecureKeyStore.remove("pinAttempts")
          setIsPinEnabled(false)
        },
        (err) => {
          // unable to remove PIN
        },
      )
    }
  }

  return (
    <Screen style={styles.container} preset="scroll">
      <View style={styles.settingContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{translate("SecurityScreen.biometricTitle")}</Text>
          <Text style={styles.subtitle}>
            {translate("SecurityScreen.biometricSubtitle")}
          </Text>
          <Text style={styles.description}>
            {translate("SecurityScreen.biometricDescription")}
          </Text>
        </View>
        <Switch
          style={styles.switch}
          value={isBiometricsEnabled}
          color={palette.lightBlue}
          onValueChange={(value) => onBiometricsValueChanged(value)}
        />
      </View>
      <View style={styles.settingContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{translate("SecurityScreen.pinTitle")}</Text>
          <Text style={styles.subtitle}>{translate("SecurityScreen.pinSubtitle")}</Text>
          <Text style={styles.description}>
            {translate("SecurityScreen.pinDescription")}
          </Text>
        </View>
        <Switch
          style={styles.switch}
          value={isPinEnabled}
          color={palette.lightBlue}
          onValueChange={(value) => onPinValueChanged(value)}
        />
      </View>
      <View style={styles.settingContainer}>
        <Button
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          title={translate("SecurityScreen.setPin")}
          onPress={() => navigation.navigate("pin", { screenPurpose: "setPIN" })}
        />
      </View>
    </Screen>
  )
}
